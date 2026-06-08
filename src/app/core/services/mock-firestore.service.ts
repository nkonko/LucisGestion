import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Timestamp } from 'firebase/firestore';
import type { Ingredient } from '../models/ingredient';
import type { Recipe } from '../models/recipe';
import type { Sale } from '../models/sale';
import type { Customer } from '../models/customer';
import type { FixedCostMonthDoc } from '../models/fixed-cost';
import type { AppBackupFile, BackupJsonValue, BackupProgressCallback } from '../models/backup';
import type { StockAdjustmentInput, SupplyPurchaseAtomicInput } from '../models/stock';
import { APP_DATA_COLLECTIONS } from './firestore.service';

type MockDocument = Record<string, unknown> & {
  id?: string;
  active?: boolean;
  endDate?: Timestamp;
};

@Injectable()
export class MockFirestoreService {
  private collections = new Map<string, BehaviorSubject<unknown[]>>();

  constructor() {
    this.seed();
  }

  async createBackup(onProgress?: BackupProgressCallback): Promise<AppBackupFile> {
    onProgress?.(0);
    const collections: Record<string, AppBackupFile['collections'][string]> = {};

    for (const [index, collectionName] of APP_DATA_COLLECTIONS.entries()) {
      const collection = this.getOrCreate(collectionName).value;
      collections[collectionName] = collection.map((item) => {
        const document = item as MockDocument;
        const { id, ...data } = document;
        return {
          id: id ?? this.createDocumentId(collectionName),
          data: this.serializeRecord(data),
        };
      });
      onProgress?.(Math.round(((index + 1) / APP_DATA_COLLECTIONS.length) * 100));
    }

    return {
      schema: 'lucis-gestion-backup',
      version: 1,
      generatedAt: new Date().toISOString(),
      collections,
    };
  }

  async restoreBackup(backup: AppBackupFile, onProgress?: BackupProgressCallback): Promise<void> {
    this.assertBackupFile(backup);
    onProgress?.(0);
    for (const [index, collectionName] of APP_DATA_COLLECTIONS.entries()) {
      const documents = backup.collections[collectionName] ?? [];
      this.getOrCreate(collectionName).next(
        documents.map((document) => ({
          id: document.id,
          ...this.deserializeRecord(document.data),
        })),
      );
      onProgress?.(Math.round(((index + 1) / APP_DATA_COLLECTIONS.length) * 100));
    }
  }

  parseBackupJson(content: string): AppBackupFile {
    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      throw new Error('El archivo seleccionado no es un JSON válido.');
    }

    this.assertBackupFile(parsed);
    return parsed;
  }

  getCollection<T>(path: string, ..._constraints: unknown[]): Observable<T[]> {
    return this.getOrCreate(path).asObservable() as Observable<T[]>;
  }

  async addDocument<T extends Record<string, unknown>>(path: string, data: T): Promise<string> {
    const col = this.getOrCreate(path);
    const id = 'mock-' + crypto.randomUUID().slice(0, 8);
    const { id: _, ...rest } = data;
    col.next([...col.value, { id, ...rest }]);
    return id;
  }

  async updateDocument(path: string, id: string, data: Record<string, unknown>): Promise<void> {
    const col = this.getOrCreate(path);
    col.next(
      col.value.map((item) => {
        const doc = item as MockDocument;
        return doc.id === id ? { ...doc, ...data } : doc;
      }),
    );
  }

  async deleteDocument(path: string, id: string): Promise<void> {
    const col = this.getOrCreate(path);
    col.next(col.value.filter((item) => (item as MockDocument).id !== id));
  }

  async clearCustomerReferencesInSales(customerId: string): Promise<void> {
    const salesCol = this.getOrCreate('sales');
    salesCol.next(
      salesCol.value.map((item) => {
        const sale = item as MockDocument;
        if (sale['customerId'] !== customerId) {
          return sale;
        }
        return {
          ...sale,
          customerId: null,
          customerName: '',
        };
      }),
    );
  }

  async softDelete(path: string, id: string): Promise<void> {
    const col = this.getOrCreate(path);
    col.next(
      col.value.map((item) => {
        const doc = item as MockDocument;
        return doc.id === id ? { ...doc, active: false, endDate: Timestamp.now() } : doc;
      }),
    );
  }

  createDocumentId(_path: string): string {
    return 'mock-' + crypto.randomUUID().slice(0, 8);
  }

  async registerSupplyPurchaseAtomic(
    input: SupplyPurchaseAtomicInput,
  ): Promise<{ expenseId: string; alreadyApplied: boolean }> {
    const expensesCol = this.getOrCreate('supplyExpenses');

    const exists = expensesCol.value.some((item) => (item as MockDocument).id === input.expenseId);
    if (exists) {
      return { expenseId: input.expenseId, alreadyApplied: true };
    }

    const ingredientsCol = this.getOrCreate('ingredients');
    const movementsCol = this.getOrCreate('stockMovements');

    const ingredients = ingredientsCol.value.map((item) => ({
      ...(item as Record<string, unknown>),
    }));
    const movements = [...movementsCol.value];

    const expense = {
      id: input.expenseId,
      date: input.date,
      description: input.description,
      supplier: input.supplier,
      total: input.total,
      items: input.items.map((item) => ({
        ingredientId: item.ingredientId,
        name: item.ingredientName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.quantity * item.unitPrice,
      })),
    };

    for (const item of input.items) {
      const idx = ingredients.findIndex((i) => i['id'] === item.ingredientId);
      if (idx === -1) continue;

      const currentStock = Number(ingredients[idx]['currentStock'] ?? 0);
      ingredients[idx] = {
        ...ingredients[idx],
        currentStock: currentStock + item.quantity,
        unitPrice: item.unitPrice,
        lastPurchase: input.date,
      };

      movements.push({
        id: 'mock-' + crypto.randomUUID().slice(0, 8),
        ingredientId: item.ingredientId,
        ingredientName: item.ingredientName,
        type: 'purchase',
        quantity: item.quantity,
        date: input.date,
        saleId: null,
        expenseId: input.expenseId,
      });
    }

    expensesCol.next([...expensesCol.value, expense]);
    ingredientsCol.next(ingredients);
    movementsCol.next(movements);

    return { expenseId: input.expenseId, alreadyApplied: false };
  }

  async applyStockAdjustments(
    saleId: string,
    movementType: 'sale_deduction' | 'cancellation_restock',
    adjustments: StockAdjustmentInput[],
  ): Promise<void> {
    if (adjustments.length === 0) return;

    const ingredientsCol = this.getOrCreate('ingredients');
    const movementsCol = this.getOrCreate('stockMovements');

    const ingredients = ingredientsCol.value.map((item) => ({
      ...(item as Record<string, unknown>),
    }));
    const movements = [...movementsCol.value];

    for (const adjustment of adjustments) {
      const idx = ingredients.findIndex((item) => item['id'] === adjustment.ingredientId);
      if (idx === -1) continue;

      const currentStock = Number(ingredients[idx]['currentStock'] ?? 0);
      const newStock = Math.max(0, currentStock + adjustment.delta);
      const appliedDelta = newStock - currentStock;

      ingredients[idx] = {
        ...ingredients[idx],
        currentStock: newStock,
      };

      if (appliedDelta === 0) continue;

      movements.push({
        id: 'mock-' + crypto.randomUUID().slice(0, 8),
        ingredientId: adjustment.ingredientId,
        ingredientName: adjustment.ingredientName,
        type: movementType,
        quantity: appliedDelta,
        date: Timestamp.now(),
        saleId,
      });
    }

    ingredientsCol.next(ingredients);
    movementsCol.next(movements);
  }

  private serializeRecord(data: Record<string, unknown>): Record<string, BackupJsonValue> {
    const serialized: Record<string, BackupJsonValue> = {};
    for (const [key, value] of Object.entries(data)) {
      const nextValue = this.serializeValue(value);
      if (nextValue !== undefined) {
        serialized[key] = nextValue;
      }
    }
    return serialized;
  }

  private serializeValue(value: unknown): BackupJsonValue | undefined {
    if (value === undefined) return undefined;
    if (
      value === null ||
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    ) {
      return value;
    }
    if (value instanceof Timestamp) {
      return {
        __lucisBackupType: 'timestamp',
        seconds: value.seconds,
        nanoseconds: value.nanoseconds,
      };
    }
    if (value instanceof Date) {
      return { __lucisBackupType: 'date', iso: value.toISOString() };
    }
    if (Array.isArray(value)) {
      return value.map((item) => this.serializeValue(item) ?? null);
    }
    if (this.isRecord(value)) {
      return this.serializeRecord(value);
    }
    return null;
  }

  private deserializeRecord(data: Record<string, BackupJsonValue>): Record<string, unknown> {
    const deserialized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      deserialized[key] = this.deserializeValue(value);
    }
    return deserialized;
  }

  private deserializeValue(value: BackupJsonValue): unknown {
    if (
      value === null ||
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    ) {
      return value;
    }
    if (Array.isArray(value)) {
      return value.map((item) => this.deserializeValue(item));
    }
    if (!this.isRecord(value)) {
      return null;
    }
    if (value['__lucisBackupType'] === 'timestamp') {
      const seconds = value['seconds'];
      const nanoseconds = value['nanoseconds'];
      if (typeof seconds === 'number' && typeof nanoseconds === 'number') {
        return new Timestamp(seconds, nanoseconds);
      }
    }
    if (value['__lucisBackupType'] === 'date') {
      const iso = value['iso'];
      if (typeof iso === 'string') {
        return new Date(iso);
      }
    }
    return this.deserializeRecord(value);
  }

  private assertBackupFile(value: unknown): asserts value is AppBackupFile {
    if (
      !this.isRecord(value) ||
      value['schema'] !== 'lucis-gestion-backup' ||
      value['version'] !== 1
    ) {
      throw new Error('El archivo de backup no tiene un formato válido.');
    }

    const collections = value['collections'];
    if (!this.isRecord(collections)) {
      throw new Error('El archivo de backup no contiene colecciones válidas.');
    }

    for (const collectionName of APP_DATA_COLLECTIONS) {
      const documents = collections[collectionName];
      if (!Array.isArray(documents)) {
        throw new Error(`El backup no contiene la colección ${collectionName}.`);
      }

      for (const backupDocument of documents) {
        if (
          !this.isRecord(backupDocument) ||
          typeof backupDocument['id'] !== 'string' ||
          !this.isRecord(backupDocument['data'])
        ) {
          throw new Error(`La colección ${collectionName} contiene documentos inválidos.`);
        }
      }
    }
  }

  private isRecord(value: unknown): value is Record<string, BackupJsonValue> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  private getOrCreate(path: string): BehaviorSubject<unknown[]> {
    if (!this.collections.has(path)) {
      this.collections.set(path, new BehaviorSubject<unknown[]>([]));
    }
    return this.collections.get(path)!;
  }

  // ---------------------------------------------------------------------------
  // Seed data
  // ---------------------------------------------------------------------------
  private seed(): void {
    const ts = (y: number, m: number, d: number) => Timestamp.fromDate(new Date(y, m - 1, d));

    // --- Ingredients (sorted by name asc) ------------------------------------
    const ingredients: Ingredient[] = [
      {
        id: 'ing-1',
        name: 'Azúcar',
        unit: 'kg',
        unitPrice: 600,
        currentStock: 10,
        minimumStock: 3,
        category: 'sugars',
        lastPurchase: ts(2026, 5, 20),
        active: true,
      },
      {
        id: 'ing-2',
        name: 'Cacao amargo',
        unit: 'kg',
        unitPrice: 5200,
        currentStock: 1.5,
        minimumStock: 1,
        category: 'dry',
        lastPurchase: ts(2026, 5, 18),
        active: true,
      },
      {
        id: 'ing-3',
        name: 'Chocolate cobertura',
        unit: 'kg',
        unitPrice: 7500,
        currentStock: 0.8,
        minimumStock: 1,
        category: 'decoration',
        lastPurchase: ts(2026, 5, 15),
        active: true,
      },
      {
        id: 'ing-4',
        name: 'Crema de leche',
        unit: 'lt',
        unitPrice: 2800,
        currentStock: 4,
        minimumStock: 2,
        category: 'dairy',
        lastPurchase: ts(2026, 5, 22),
        active: true,
      },
      {
        id: 'ing-5',
        name: 'Dulce de leche',
        unit: 'kg',
        unitPrice: 3200,
        currentStock: 2,
        minimumStock: 1,
        category: 'dairy',
        lastPurchase: ts(2026, 5, 20),
        active: true,
      },
      {
        id: 'ing-6',
        name: 'Esencia de vainilla',
        unit: 'ml',
        unitPrice: 15,
        currentStock: 200,
        minimumStock: 50,
        category: 'other',
        lastPurchase: ts(2026, 5, 10),
        active: true,
      },
      {
        id: 'ing-7',
        name: 'Harina 0000',
        unit: 'kg',
        unitPrice: 800,
        currentStock: 15,
        minimumStock: 5,
        category: 'dry',
        lastPurchase: ts(2026, 5, 22),
        active: true,
      },
      {
        id: 'ing-8',
        name: 'Huevos',
        unit: 'unit',
        unitPrice: 150,
        currentStock: 48,
        minimumStock: 12,
        category: 'eggs',
        lastPurchase: ts(2026, 5, 24),
        active: true,
      },
      {
        id: 'ing-9',
        name: 'Leche',
        unit: 'lt',
        unitPrice: 900,
        currentStock: 8,
        minimumStock: 4,
        category: 'dairy',
        lastPurchase: ts(2026, 5, 22),
        active: true,
      },
      {
        id: 'ing-10',
        name: 'Manteca',
        unit: 'kg',
        unitPrice: 3500,
        currentStock: 3,
        minimumStock: 2,
        category: 'fats',
        lastPurchase: ts(2026, 5, 20),
        active: true,
      },
    ];

    // --- Recipes (sorted by name asc) ----------------------------------------
    const recipes: Recipe[] = [
      {
        id: 'rec-1',
        name: 'Alfajores de Maicena (x12)',
        category: 'cookies',
        ingredients: [
          { ingredientId: 'ing-7', name: 'Harina 0000', quantity: 0.3, unit: 'kg', lineCost: 240 },
          { ingredientId: 'ing-1', name: 'Azúcar', quantity: 0.15, unit: 'kg', lineCost: 90 },
          { ingredientId: 'ing-10', name: 'Manteca', quantity: 0.2, unit: 'kg', lineCost: 700 },
          { ingredientId: 'ing-8', name: 'Huevos', quantity: 2, unit: 'unit', lineCost: 300 },
          {
            ingredientId: 'ing-6',
            name: 'Esencia de vainilla',
            quantity: 10,
            unit: 'ml',
            lineCost: 150,
          },
          {
            ingredientId: 'ing-5',
            name: 'Dulce de leche',
            quantity: 0.4,
            unit: 'kg',
            lineCost: 1280,
          },
        ],
        calculatedCost: 2760,
        profitMargin: 70,
        suggestedPrice: 4692,
        salePrice: 4500,
        yield: 12,
        notes: 'Clásicos argentinos',
        imageUrl: '',
        active: true,
      },
      {
        id: 'rec-2',
        name: 'Budín de Limón',
        category: 'breads',
        ingredients: [
          { ingredientId: 'ing-7', name: 'Harina 0000', quantity: 0.25, unit: 'kg', lineCost: 200 },
          { ingredientId: 'ing-1', name: 'Azúcar', quantity: 0.2, unit: 'kg', lineCost: 120 },
          { ingredientId: 'ing-8', name: 'Huevos', quantity: 3, unit: 'unit', lineCost: 450 },
          { ingredientId: 'ing-10', name: 'Manteca', quantity: 0.12, unit: 'kg', lineCost: 420 },
          { ingredientId: 'ing-9', name: 'Leche', quantity: 0.15, unit: 'lt', lineCost: 135 },
          {
            ingredientId: 'ing-6',
            name: 'Esencia de vainilla',
            quantity: 5,
            unit: 'ml',
            lineCost: 75,
          },
        ],
        calculatedCost: 1400,
        profitMargin: 80,
        suggestedPrice: 2520,
        salePrice: 2500,
        yield: 8,
        notes: 'Con glasé de limón',
        imageUrl: '',
        active: true,
      },
      {
        id: 'rec-3',
        name: 'Cheesecake',
        category: 'pies',
        ingredients: [
          { ingredientId: 'ing-7', name: 'Harina 0000', quantity: 0.15, unit: 'kg', lineCost: 120 },
          { ingredientId: 'ing-1', name: 'Azúcar', quantity: 0.2, unit: 'kg', lineCost: 120 },
          { ingredientId: 'ing-10', name: 'Manteca', quantity: 0.15, unit: 'kg', lineCost: 525 },
          { ingredientId: 'ing-8', name: 'Huevos', quantity: 4, unit: 'unit', lineCost: 600 },
          {
            ingredientId: 'ing-4',
            name: 'Crema de leche',
            quantity: 0.5,
            unit: 'lt',
            lineCost: 1400,
          },
          {
            ingredientId: 'ing-5',
            name: 'Dulce de leche',
            quantity: 0.3,
            unit: 'kg',
            lineCost: 960,
          },
        ],
        calculatedCost: 3725,
        profitMargin: 65,
        suggestedPrice: 6147,
        salePrice: 6500,
        yield: 10,
        notes: 'Base de galletitas',
        imageUrl: '',
        active: true,
      },
      {
        id: 'rec-4',
        name: 'Torta de Chocolate',
        category: 'cakes',
        ingredients: [
          { ingredientId: 'ing-7', name: 'Harina 0000', quantity: 0.4, unit: 'kg', lineCost: 320 },
          { ingredientId: 'ing-1', name: 'Azúcar', quantity: 0.3, unit: 'kg', lineCost: 180 },
          { ingredientId: 'ing-8', name: 'Huevos', quantity: 6, unit: 'unit', lineCost: 900 },
          { ingredientId: 'ing-10', name: 'Manteca', quantity: 0.25, unit: 'kg', lineCost: 875 },
          {
            ingredientId: 'ing-2',
            name: 'Cacao amargo',
            quantity: 0.15,
            unit: 'kg',
            lineCost: 780,
          },
          { ingredientId: 'ing-9', name: 'Leche', quantity: 0.3, unit: 'lt', lineCost: 270 },
          {
            ingredientId: 'ing-4',
            name: 'Crema de leche',
            quantity: 0.5,
            unit: 'lt',
            lineCost: 1400,
          },
        ],
        calculatedCost: 4725,
        profitMargin: 60,
        suggestedPrice: 7560,
        salePrice: 7500,
        yield: 12,
        notes: 'La más pedida',
        imageUrl: '',
        active: true,
      },
    ];

    // --- Customers (sorted by name asc) --------------------------------------
    const customers: Customer[] = [
      {
        id: 'cli-1',
        name: 'Ana Martínez',
        phone: '1162345678',
        address: 'Av. Alvear 1800, Recoleta',
        notes: 'Siempre pide budín para eventos',
        totalPurchases: 4,
        lastPurchase: ts(2026, 5, 25),
      },
      {
        id: 'cli-2',
        name: 'Carlos Rodríguez',
        phone: '1148765432',
        address: 'Av. Cabildo 1500, Belgrano',
        notes: '',
        totalPurchases: 1,
        lastPurchase: ts(2026, 5, 8),
      },
      {
        id: 'cli-3',
        name: 'Lucía Fernández',
        phone: '1171234567',
        address: 'Av. Rivadavia 5400, Caballito',
        notes: 'Pedidos para oficina',
        totalPurchases: 6,
        lastPurchase: ts(2026, 5, 24),
      },
      {
        id: 'cli-4',
        name: 'María López',
        phone: '1155234567',
        address: 'Av. Santa Fe 3200, Palermo',
        notes: 'Clienta frecuente, prefiere chocolate',
        totalPurchases: 4,
        lastPurchase: ts(2026, 5, 26),
      },
    ];

    // --- Sales (all in May 2026 to match default dashboard month) ------------
    const sales: Sale[] = [
      // Lucía Fernández (cli-3) — 6 purchases, $98,500 → tier 'alto', priority customer
      {
        id: 'ven-1',
        date: ts(2026, 5, 2),
        customerId: 'cli-3',
        customerName: 'Lucía Fernández',
        items: [
          { recipeId: 'rec-3', name: 'Cheesecake', quantity: 1, unitPrice: 6500, unitCost: 3725 },
          {
            recipeId: 'rec-1',
            name: 'Alfajores de Maicena (x12)',
            quantity: 1,
            unitPrice: 4500,
            unitCost: 2760,
          },
        ],
        total: 11000,
        totalCost: 6485,
        profit: 4515,
        paymentMethod: 'transfer',
        status: 'delivered',
        notes: '',
      },
      {
        id: 'ven-2',
        date: ts(2026, 5, 6),
        customerId: 'cli-3',
        customerName: 'Lucía Fernández',
        items: [
          { recipeId: 'rec-3', name: 'Cheesecake', quantity: 2, unitPrice: 6500, unitCost: 3725 },
          {
            recipeId: 'rec-4',
            name: 'Torta de Chocolate',
            quantity: 1,
            unitPrice: 7500,
            unitCost: 4725,
          },
        ],
        total: 20500,
        totalCost: 12175,
        profit: 8325,
        paymentMethod: 'mercadopago',
        status: 'delivered',
        notes: '',
      },
      {
        id: 'ven-3',
        date: ts(2026, 5, 10),
        customerId: 'cli-3',
        customerName: 'Lucía Fernández',
        items: [
          {
            recipeId: 'rec-1',
            name: 'Alfajores de Maicena (x12)',
            quantity: 4,
            unitPrice: 4500,
            unitCost: 2760,
          },
        ],
        total: 18000,
        totalCost: 11040,
        profit: 6960,
        paymentMethod: 'transfer',
        status: 'delivered',
        notes: '',
      },
      {
        id: 'ven-4',
        date: ts(2026, 5, 15),
        customerId: 'cli-3',
        customerName: 'Lucía Fernández',
        items: [
          {
            recipeId: 'rec-4',
            name: 'Torta de Chocolate',
            quantity: 1,
            unitPrice: 7500,
            unitCost: 4725,
          },
          {
            recipeId: 'rec-2',
            name: 'Budín de Limón',
            quantity: 2,
            unitPrice: 2500,
            unitCost: 1400,
          },
        ],
        total: 12500,
        totalCost: 7525,
        profit: 4975,
        paymentMethod: 'cash',
        status: 'delivered',
        notes: '',
      },
      {
        id: 'ven-5',
        date: ts(2026, 5, 20),
        customerId: 'cli-3',
        customerName: 'Lucía Fernández',
        items: [
          {
            recipeId: 'rec-1',
            name: 'Alfajores de Maicena (x12)',
            quantity: 5,
            unitPrice: 4500,
            unitCost: 2760,
          },
        ],
        total: 22500,
        totalCost: 13800,
        profit: 8700,
        paymentMethod: 'transfer',
        status: 'delivered',
        notes: '',
      },
      {
        id: 'ven-6',
        date: ts(2026, 5, 24),
        customerId: 'cli-3',
        customerName: 'Lucía Fernández',
        items: [
          { recipeId: 'rec-3', name: 'Cheesecake', quantity: 1, unitPrice: 6500, unitCost: 3725 },
          {
            recipeId: 'rec-4',
            name: 'Torta de Chocolate',
            quantity: 1,
            unitPrice: 7500,
            unitCost: 4725,
          },
        ],
        total: 14000,
        totalCost: 8450,
        profit: 5550,
        paymentMethod: 'mercadopago',
        status: 'pending',
        notes: 'Entregar a las 17hs',
      },

      // Ana Martínez (cli-1) — 4 purchases, $64,500 → tier 'medio'
      {
        id: 'ven-7',
        date: ts(2026, 5, 3),
        customerId: 'cli-1',
        customerName: 'Ana Martínez',
        items: [
          {
            recipeId: 'rec-1',
            name: 'Alfajores de Maicena (x12)',
            quantity: 5,
            unitPrice: 4500,
            unitCost: 2760,
          },
          {
            recipeId: 'rec-2',
            name: 'Budín de Limón',
            quantity: 2,
            unitPrice: 2500,
            unitCost: 1400,
          },
        ],
        total: 27500,
        totalCost: 16600,
        profit: 10900,
        paymentMethod: 'mercadopago',
        status: 'delivered',
        notes: 'Para cumpleaños',
      },
      {
        id: 'ven-8',
        date: ts(2026, 5, 11),
        customerId: 'cli-1',
        customerName: 'Ana Martínez',
        items: [
          { recipeId: 'rec-3', name: 'Cheesecake', quantity: 3, unitPrice: 6500, unitCost: 3725 },
        ],
        total: 19500,
        totalCost: 11175,
        profit: 8325,
        paymentMethod: 'mercadopago',
        status: 'delivered',
        notes: '',
      },
      {
        id: 'ven-9',
        date: ts(2026, 5, 18),
        customerId: 'cli-1',
        customerName: 'Ana Martínez',
        items: [
          {
            recipeId: 'rec-4',
            name: 'Torta de Chocolate',
            quantity: 1,
            unitPrice: 7500,
            unitCost: 4725,
          },
          {
            recipeId: 'rec-2',
            name: 'Budín de Limón',
            quantity: 2,
            unitPrice: 2500,
            unitCost: 1400,
          },
        ],
        total: 12500,
        totalCost: 7525,
        profit: 4975,
        paymentMethod: 'cash',
        status: 'delivered',
        notes: '',
      },
      {
        id: 'ven-10',
        date: ts(2026, 5, 25),
        customerId: 'cli-1',
        customerName: 'Ana Martínez',
        items: [
          {
            recipeId: 'rec-2',
            name: 'Budín de Limón',
            quantity: 2,
            unitPrice: 2500,
            unitCost: 1400,
          },
        ],
        total: 5000,
        totalCost: 2800,
        profit: 2200,
        paymentMethod: 'cash',
        status: 'delivered',
        notes: '',
      },

      // María López (cli-4) — 4 purchases, $44,000 → tier 'medio' (≥3 orders)
      {
        id: 'ven-11',
        date: ts(2026, 5, 4),
        customerId: 'cli-4',
        customerName: 'María López',
        items: [
          {
            recipeId: 'rec-1',
            name: 'Alfajores de Maicena (x12)',
            quantity: 2,
            unitPrice: 4500,
            unitCost: 2760,
          },
          {
            recipeId: 'rec-2',
            name: 'Budín de Limón',
            quantity: 1,
            unitPrice: 2500,
            unitCost: 1400,
          },
        ],
        total: 11500,
        totalCost: 6920,
        profit: 4580,
        paymentMethod: 'transfer',
        status: 'delivered',
        notes: '',
      },
      {
        id: 'ven-12',
        date: ts(2026, 5, 12),
        customerId: 'cli-4',
        customerName: 'María López',
        items: [
          {
            recipeId: 'rec-4',
            name: 'Torta de Chocolate',
            quantity: 1,
            unitPrice: 7500,
            unitCost: 4725,
          },
        ],
        total: 7500,
        totalCost: 4725,
        profit: 2775,
        paymentMethod: 'mercadopago',
        status: 'delivered',
        notes: '',
      },
      {
        id: 'ven-13',
        date: ts(2026, 5, 19),
        customerId: 'cli-4',
        customerName: 'María López',
        items: [
          { recipeId: 'rec-3', name: 'Cheesecake', quantity: 1, unitPrice: 6500, unitCost: 3725 },
          {
            recipeId: 'rec-2',
            name: 'Budín de Limón',
            quantity: 2,
            unitPrice: 2500,
            unitCost: 1400,
          },
        ],
        total: 11500,
        totalCost: 6525,
        profit: 4975,
        paymentMethod: 'cash',
        status: 'delivered',
        notes: '',
      },
      {
        id: 'ven-14',
        date: ts(2026, 5, 26),
        customerId: 'cli-4',
        customerName: 'María López',
        items: [
          {
            recipeId: 'rec-1',
            name: 'Alfajores de Maicena (x12)',
            quantity: 3,
            unitPrice: 4500,
            unitCost: 2760,
          },
        ],
        total: 13500,
        totalCost: 8280,
        profit: 5220,
        paymentMethod: 'transfer',
        status: 'delivered',
        notes: '',
      },

      // Carlos Rodríguez (cli-2) — 1 purchase, $11,000 → tier 'bajo'
      {
        id: 'ven-15',
        date: ts(2026, 5, 8),
        customerId: 'cli-2',
        customerName: 'Carlos Rodríguez',
        items: [
          { recipeId: 'rec-3', name: 'Cheesecake', quantity: 1, unitPrice: 6500, unitCost: 3725 },
          {
            recipeId: 'rec-1',
            name: 'Alfajores de Maicena (x12)',
            quantity: 1,
            unitPrice: 4500,
            unitCost: 2760,
          },
        ],
        total: 11000,
        totalCost: 6485,
        profit: 4515,
        paymentMethod: 'cash',
        status: 'delivered',
        notes: '',
      },

      // Consumidor final (sin customerId) — anónimo
      {
        id: 'ven-16',
        date: ts(2026, 5, 16),
        customerId: null,
        customerName: 'Consumidor final',
        items: [
          {
            recipeId: 'rec-2',
            name: 'Budín de Limón',
            quantity: 3,
            unitPrice: 2500,
            unitCost: 1400,
          },
          {
            recipeId: 'rec-4',
            name: 'Torta de Chocolate',
            quantity: 1,
            unitPrice: 7500,
            unitCost: 4725,
          },
        ],
        total: 15000,
        totalCost: 8925,
        profit: 6075,
        paymentMethod: 'cash',
        status: 'delivered',
        notes: '',
      },
      {
        id: 'ven-17',
        date: ts(2026, 5, 28),
        customerId: null,
        customerName: 'Consumidor final',
        items: [
          {
            recipeId: 'rec-1',
            name: 'Alfajores de Maicena (x12)',
            quantity: 3,
            unitPrice: 4500,
            unitCost: 2760,
          },
        ],
        total: 13500,
        totalCost: 8280,
        profit: 5220,
        paymentMethod: 'cash',
        status: 'delivered',
        notes: '',
      },
      {
        id: 'ven-18',
        date: ts(2026, 5, 30),
        customerId: null,
        customerName: 'Consumidor final',
        items: [
          { recipeId: 'rec-3', name: 'Cheesecake', quantity: 1, unitPrice: 6500, unitCost: 3725 },
          {
            recipeId: 'rec-2',
            name: 'Budín de Limón',
            quantity: 1,
            unitPrice: 2500,
            unitCost: 1400,
          },
        ],
        total: 9000,
        totalCost: 5125,
        profit: 3875,
        paymentMethod: 'cash',
        status: 'delivered',
        notes: '',
      },
    ];

    this.getOrCreate('ingredients').next(ingredients);
    this.getOrCreate('recipes').next(recipes);
    this.getOrCreate('customers').next(customers);
    this.getOrCreate('sales').next(sales);
    this.getOrCreate('priceHistory').next([]);
    this.getOrCreate('stockMovements').next([]);
    this.getOrCreate('supplyExpenses').next([
      {
        id: 'sup-1',
        date: ts(2026, 5, 2),
        description: 'Compra semanal mayorista',
        supplier: 'Distribuidora Centro',
        total: 32000,
        items: [],
      },
      {
        id: 'sup-2',
        date: ts(2026, 4, 18),
        description: 'Reposicion de lácteos y chocolates',
        supplier: 'Mercado Norte',
        total: 24500,
        items: [],
      },
      {
        id: 'sup-3',
        date: ts(2026, 3, 10),
        description: 'Compra mensual de secos',
        supplier: 'Proveedor Sur',
        total: 18750,
        items: [],
      },
    ]);

    // --- Fixed Costs (multi-month history) -----------------------------------
    // Utility: Feb 40000 → Mar 42000 → Apr 45000 → May 65000  (+54% vs avg → critical)
    // Rent:    Feb 130000 → Mar 130000 → Apr 140000 → May 150000 (+12.5% → ok)
    // Taxes:   Feb 30000 → Mar 32000 → Apr 33000 → May 55000   (+74% vs avg → critical)
    // Other:   Feb 10000 → Mar 11000 → Apr 12000 → May 18000   (+64% vs avg → critical)

    const fcData = [
      { monthKey: '2026-02', rent: 130000, utilities: 40000, taxes: 30000, other: 10000 },
      { monthKey: '2026-03', rent: 130000, utilities: 42000, taxes: 32000, other: 11000 },
      { monthKey: '2026-04', rent: 140000, utilities: 45000, taxes: 33000, other: 12000 },
      { monthKey: '2026-05', rent: 150000, utilities: 65000, taxes: 55000, other: 18000 },
    ];

    const fixedCostsByMonth: FixedCostMonthDoc[] = [];
    for (const fc of fcData) {
      fixedCostsByMonth.push({
        id: `cfm-anchor-${fc.monthKey}`,
        monthKey: fc.monthKey,
        isAnchor: true,
      });
      fixedCostsByMonth.push({
        id: `cfm-${fc.monthKey}-rent`,
        monthKey: fc.monthKey,
        lineageId: 'lin-rent',
        name: 'Alquiler del local',
        description: 'Pago el 1 de cada mes',
        amount: fc.rent,
        category: 'rent',
      });
      fixedCostsByMonth.push({
        id: `cfm-${fc.monthKey}-util`,
        monthKey: fc.monthKey,
        lineageId: 'lin-util',
        name: 'Luz, gas e internet',
        description: 'Servicios',
        amount: fc.utilities,
        category: 'utilities',
      });
      fixedCostsByMonth.push({
        id: `cfm-${fc.monthKey}-tax`,
        monthKey: fc.monthKey,
        lineageId: 'lin-tax',
        name: 'Monotributo',
        description: 'Categoría D',
        amount: fc.taxes,
        category: 'taxes',
      });
      fixedCostsByMonth.push({
        id: `cfm-${fc.monthKey}-other`,
        monthKey: fc.monthKey,
        lineageId: 'lin-other',
        name: 'Seguro de comercio',
        description: '',
        amount: fc.other,
        category: 'other',
      });
    }
    this.getOrCreate('fixedCostsByMonth').next(fixedCostsByMonth);
  }
}
