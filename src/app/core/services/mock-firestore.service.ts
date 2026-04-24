import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Timestamp } from 'firebase/firestore';
import type { Ingredient } from '../models/ingredient';
import type { Recipe } from '../models/recipe';
import type { Sale } from '../models/sale';
import type { Customer } from '../models/customer';
import type { FixedCost } from '../models/fixed-cost';
import type { StockAdjustmentInput } from '../models/stock';

@Injectable()
export class MockFirestoreService {
  private collections = new Map<string, BehaviorSubject<unknown[]>>();

  constructor() {
    this.seed();
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
    col.next(col.value.map((item: any) => (item.id === id ? { ...item, ...data } : item)));
  }

  async softDelete(path: string, id: string): Promise<void> {
    const col = this.getOrCreate(path);
    col.next(col.value.filter((item: any) => item.id !== id));
  }

  async applyStockAdjustments(
    saleId: string,
    movementType: 'sale_deduction' | 'cancellation_restock',
    adjustments: StockAdjustmentInput[],
  ): Promise<void> {
    if (adjustments.length === 0) return;

    const ingredientsCol = this.getOrCreate('ingredients');
    const movementsCol = this.getOrCreate('stockMovements');

    const ingredients = ingredientsCol.value.map((item) => ({ ...(item as Record<string, unknown>) }));
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
        lastPurchase: ts(2026, 3, 25),
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
        lastPurchase: ts(2026, 3, 20),
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
        lastPurchase: ts(2026, 3, 10),
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
        lastPurchase: ts(2026, 3, 28),
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
        lastPurchase: ts(2026, 3, 22),
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
        lastPurchase: ts(2026, 3, 15),
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
        lastPurchase: ts(2026, 3, 30),
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
        lastPurchase: ts(2026, 4, 1),
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
        lastPurchase: ts(2026, 3, 29),
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
        lastPurchase: ts(2026, 3, 27),
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
          { ingredientId: 'ing-6', name: 'Esencia de vainilla', quantity: 10, unit: 'ml', lineCost: 150 },
          { ingredientId: 'ing-5', name: 'Dulce de leche', quantity: 0.4, unit: 'kg', lineCost: 1280 },
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
          { ingredientId: 'ing-6', name: 'Esencia de vainilla', quantity: 5, unit: 'ml', lineCost: 75 },
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
          { ingredientId: 'ing-4', name: 'Crema de leche', quantity: 0.5, unit: 'lt', lineCost: 1400 },
          { ingredientId: 'ing-5', name: 'Dulce de leche', quantity: 0.3, unit: 'kg', lineCost: 960 },
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
          { ingredientId: 'ing-2', name: 'Cacao amargo', quantity: 0.15, unit: 'kg', lineCost: 780 },
          { ingredientId: 'ing-9', name: 'Leche', quantity: 0.3, unit: 'lt', lineCost: 270 },
          { ingredientId: 'ing-4', name: 'Crema de leche', quantity: 0.5, unit: 'lt', lineCost: 1400 },
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
        totalPurchases: 1,
        lastPurchase: ts(2026, 4, 5),
      },
      {
        id: 'cli-2',
        name: 'Carlos Rodríguez',
        phone: '1148765432',
        address: 'Av. Cabildo 1500, Belgrano',
        notes: '',
        totalPurchases: 1,
        lastPurchase: ts(2026, 4, 7),
      },
      {
        id: 'cli-3',
        name: 'Lucía Fernández',
        phone: '1171234567',
        address: 'Av. Rivadavia 5400, Caballito',
        notes: 'Pedidos para oficina',
        totalPurchases: 1,
        lastPurchase: ts(2026, 4, 10),
      },
      {
        id: 'cli-4',
        name: 'María López',
        phone: '1155234567',
        address: 'Av. Santa Fe 3200, Palermo',
        notes: 'Clienta frecuente, prefiere chocolate',
        totalPurchases: 1,
        lastPurchase: ts(2026, 4, 9),
      },
    ];

    // --- Sales (sorted by date desc) -----------------------------------------
    const sales: Sale[] = [
      {
        id: 'ven-1',
        date: ts(2026, 4, 10),
        customerId: 'cli-3',
        customerName: 'Lucía Fernández',
        items: [
          { recipeId: 'rec-3', name: 'Cheesecake', quantity: 1, unitPrice: 6500, unitCost: 3725 },
          { recipeId: 'rec-1', name: 'Alfajores de Maicena (x12)', quantity: 2, unitPrice: 4500, unitCost: 2760 },
        ],
        total: 15500,
        totalCost: 9245,
        profit: 6255,
        paymentMethod: 'transfer',
        status: 'pending',
        notes: 'Entregar a las 17hs',
      },
      {
        id: 'ven-2',
        date: ts(2026, 4, 9),
        customerId: 'cli-4',
        customerName: 'María López',
        items: [
          { recipeId: 'rec-4', name: 'Torta de Chocolate', quantity: 1, unitPrice: 7500, unitCost: 4725 },
          { recipeId: 'rec-1', name: 'Alfajores de Maicena (x12)', quantity: 1, unitPrice: 4500, unitCost: 2760 },
        ],
        total: 12000,
        totalCost: 7485,
        profit: 4515,
        paymentMethod: 'transfer',
        status: 'delivered',
        notes: '',
      },
      {
        id: 'ven-3',
        date: ts(2026, 4, 7),
        customerId: 'cli-2',
        customerName: 'Carlos Rodríguez',
        items: [
          { recipeId: 'rec-3', name: 'Cheesecake', quantity: 1, unitPrice: 6500, unitCost: 3725 },
        ],
        total: 6500,
        totalCost: 3725,
        profit: 2775,
        paymentMethod: 'cash',
        status: 'delivered',
        notes: '',
      },
      {
        id: 'ven-4',
        date: ts(2026, 4, 5),
        customerId: 'cli-1',
        customerName: 'Ana Martínez',
        items: [
          { recipeId: 'rec-2', name: 'Budín de Limón', quantity: 2, unitPrice: 2500, unitCost: 1400 },
          { recipeId: 'rec-4', name: 'Torta de Chocolate', quantity: 1, unitPrice: 7500, unitCost: 4725 },
        ],
        total: 12500,
        totalCost: 7525,
        profit: 4975,
        paymentMethod: 'mercadopago',
        status: 'delivered',
        notes: 'Para cumpleaños',
      },
      {
        id: 'ven-5',
        date: ts(2026, 4, 3),
        customerId: null,
        customerName: 'Consumidor final',
        items: [
          { recipeId: 'rec-2', name: 'Budín de Limón', quantity: 3, unitPrice: 2500, unitCost: 1400 },
        ],
        total: 7500,
        totalCost: 4200,
        profit: 3300,
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
    this.getOrCreate('supplyExpenses').next([]);

    // --- Fixed Costs ---------------------------------------------------------
    const fixedCosts: FixedCost[] = [
      {
        id: 'cf-1',
        name: 'Alquiler del local',
        description: 'Pago el 1 de cada mes',
        amount: 150000,
        frequency: 'monthly',
        category: 'rent',
        active: true,
      },
      {
        id: 'cf-2',
        name: 'Luz',
        description: 'EDESUR — bimestral prorrateado',
        amount: 25000,
        frequency: 'monthly',
        category: 'utilities',
        active: true,
      },
      {
        id: 'cf-3',
        name: 'Gas',
        description: 'Metrogas',
        amount: 18000,
        frequency: 'monthly',
        category: 'utilities',
        active: true,
      },
      {
        id: 'cf-4',
        name: 'Internet',
        description: 'Fibertel',
        amount: 12000,
        frequency: 'monthly',
        category: 'utilities',
        active: true,
      },
      {
        id: 'cf-5',
        name: 'Monotributo',
        description: 'Categoría D',
        amount: 35000,
        frequency: 'monthly',
        category: 'taxes',
        active: true,
      },
      {
        id: 'cf-6',
        name: 'Seguro de comercio',
        description: '',
        amount: 15000,
        frequency: 'monthly',
        category: 'other',
        active: true,
      },
    ];
    this.getOrCreate('fixedCosts').next(fixedCosts);
  }
}
