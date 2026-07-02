import { Injectable, InjectionToken, inject } from '@angular/core';
import * as Sentry from '@sentry/angular';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  addDoc,
  deleteDoc,
  getDocs,
  updateDoc,
  query,
  where,
  runTransaction,
  Timestamp,
  writeBatch,
  CollectionReference,
  QueryConstraint,
  DocumentReference,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { AppBackupFile, BackupJsonValue, BackupProgressCallback } from '../models/backup';
import { StockAdjustmentInput, SupplyPurchaseAtomicInput } from '../models/stock';
export type { StockAdjustmentInput, SupplyPurchaseAtomicInput };

export const APP_DATA_COLLECTIONS = [
  'users',
  'ingredients',
  'recipes',
  'customers',
  'sales',
  'priceHistory',
  'stockMovements',
  'supplyExpenses',
  'fixedCostsByMonth',
] as const;

type FirestoreData = Record<string, unknown>;
type BackupDocumentList = AppBackupFile['collections'][string];
interface BackupCollections extends Record<string, BackupDocumentList> {
  users: BackupDocumentList;
  ingredients: BackupDocumentList;
  recipes: BackupDocumentList;
  customers: BackupDocumentList;
  sales: BackupDocumentList;
  priceHistory: BackupDocumentList;
  stockMovements: BackupDocumentList;
  supplyExpenses: BackupDocumentList;
  fixedCostsByMonth: BackupDocumentList;
}
interface UnknownBackupCollections {
  users?: unknown;
  ingredients?: unknown;
  recipes?: unknown;
  customers?: unknown;
  sales?: unknown;
  priceHistory?: unknown;
  stockMovements?: unknown;
  supplyExpenses?: unknown;
  fixedCostsByMonth?: unknown;
}

interface FirestoreApi {
  addDoc: typeof addDoc;
  collection: typeof collection;
  collectionData: typeof collectionData;
  deleteDoc: typeof deleteDoc;
  doc: typeof doc;
  getDocs: typeof getDocs;
  query: typeof query;
  where: typeof where;
  runTransaction: typeof runTransaction;
  timestampNow: typeof Timestamp.now;
  updateDoc: typeof updateDoc;
  writeBatch: typeof writeBatch;
}

export const FIRESTORE_API = new InjectionToken<FirestoreApi>('Firestore API', {
  providedIn: 'root',
  factory: () => ({
    addDoc,
    collection,
    collectionData,
    deleteDoc,
    doc,
    getDocs,
    query,
    where,
    runTransaction,
    timestampNow: Timestamp.now,
    updateDoc,
    writeBatch,
  }),
});

@Injectable({ providedIn: 'root' })
export class FirestoreService {
  private firestore = inject(Firestore);
  private firestoreApi = inject(FIRESTORE_API);

  getCollection<T extends { id?: string }>(
    path: string,
    ...constraints: QueryConstraint[]
  ): Observable<T[]> {
    const ref = this.firestoreApi.collection(this.firestore, path) as CollectionReference<T>;
    const q = constraints.length > 0 ? this.firestoreApi.query(ref, ...constraints) : ref;
    return this.firestoreApi.collectionData(q, { idField: 'id' }) as Observable<T[]>;
  }

  async createBackup(onProgress?: BackupProgressCallback): Promise<AppBackupFile> {
    return this.runFirestoreOperation('create_backup', async () => {
      onProgress?.(0);
      const collections = this.createEmptyBackupCollections();

      for (const [index, collectionName] of APP_DATA_COLLECTIONS.entries()) {
        const ref = this.firestoreApi.collection(this.firestore, collectionName);
        const snapshot = await this.firestoreApi.getDocs(ref);
        this.setBackupDocuments(
          collections,
          collectionName,
          snapshot.docs.map((docSnapshot) => ({
            id: docSnapshot.id,
            data: this.serializeRecord(docSnapshot.data() as FirestoreData),
          })),
        );
        onProgress?.(Math.round(((index + 1) / APP_DATA_COLLECTIONS.length) * 100));
      }

      return {
        schema: 'lucis-gestion-backup',
        version: 1,
        generatedAt: new Date().toISOString(),
        collections,
      };
    });
  }

  async restoreBackup(backup: AppBackupFile, onProgress?: BackupProgressCallback): Promise<void> {
    this.assertBackupFile(backup);

    await this.runFirestoreOperation('restore_backup', async () => {
      onProgress?.(0);

      const staleDocuments = new Map<string, string[]>();
      let operationCount = 0;

      for (const collectionName of APP_DATA_COLLECTIONS) {
        const ref = this.firestoreApi.collection(this.firestore, collectionName);
        const snapshot = await this.firestoreApi.getDocs(ref);
        const ids = snapshot.docs.map((docSnapshot) => docSnapshot.id);
        const backupDocuments = this.getBackupDocuments(backup.collections, collectionName);
        const backupIds = new Set(backupDocuments.map((document) => document.id));
        const staleIds = ids.filter((id) => !backupIds.has(id));
        staleDocuments.set(collectionName, staleIds);
        operationCount += staleIds.length + backupDocuments.length;
      }

      if (operationCount === 0) {
        onProgress?.(100);
        return;
      }

      let completedOperations = 0;
      const updateProgress = (completed: number): void => {
        completedOperations += completed;
        onProgress?.(Math.min(100, Math.round((completedOperations / operationCount) * 100)));
      };

      for (const collectionName of APP_DATA_COLLECTIONS) {
        const documents = this.getBackupDocuments(backup.collections, collectionName);
        for (const chunk of this.chunk(documents, 450)) {
          const batch = this.firestoreApi.writeBatch(this.firestore);
          for (const backupDocument of chunk) {
            const ref = this.firestoreApi.doc(this.firestore, collectionName, backupDocument.id);
            batch.set(ref, this.deserializeRecord(backupDocument.data));
          }
          await batch.commit();
          updateProgress(chunk.length);
        }
      }

      for (const collectionName of APP_DATA_COLLECTIONS) {
        const ids = staleDocuments.get(collectionName) ?? [];
        for (const chunk of this.chunk(ids, 450)) {
          const batch = this.firestoreApi.writeBatch(this.firestore);
          for (const id of chunk) {
            const ref = this.firestoreApi.doc(this.firestore, collectionName, id);
            batch.delete(ref);
          }
          await batch.commit();
          updateProgress(chunk.length);
        }
      }

      onProgress?.(100);
    }, {
      collectionCount: APP_DATA_COLLECTIONS.length,
    });
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

  async addDocument<T extends object>(path: string, data: T): Promise<string> {
    return this.runFirestoreOperation('add_document', async () => {
      const ref = this.firestoreApi.collection(this.firestore, path);
      const { id: _, ...dataWithoutId } = data as T & { id?: unknown };
      const docRef = await this.firestoreApi.addDoc(ref, dataWithoutId as Record<string, unknown>);
      return docRef.id;
    }, {
      path,
    });
  }

  async updateDocument(path: string, id: string, data: Record<string, unknown>): Promise<void> {
    await this.runFirestoreOperation('update_document', async () => {
      const ref = this.firestoreApi.doc(this.firestore, path, id);
      const { id: _, ...dataWithoutId } = data;
      await this.firestoreApi.updateDoc(ref, dataWithoutId);
    }, {
      path,
      id,
    });
  }

  async deleteDocument(path: string, id: string): Promise<void> {
    await this.runFirestoreOperation('delete_document', async () => {
      const ref = this.firestoreApi.doc(this.firestore, path, id);
      await this.firestoreApi.deleteDoc(ref);
    }, {
      path,
      id,
    });
  }

  async clearCustomerReferencesInSales(customerId: string): Promise<void> {
    await this.runFirestoreOperation('clear_customer_references_in_sales', async () => {
      const salesRef = this.firestoreApi.collection(this.firestore, 'sales');
      const salesQuery = this.firestoreApi.query(
        salesRef,
        this.firestoreApi.where('customerId', '==', customerId),
      );
      const salesSnapshot = await this.firestoreApi.getDocs(salesQuery);

      const salesIds = salesSnapshot.docs.map((docSnapshot) => docSnapshot.id);
      for (const chunk of this.chunk(salesIds, 450)) {
        const batch = this.firestoreApi.writeBatch(this.firestore);
        for (const saleId of chunk) {
          const saleRef = this.firestoreApi.doc(this.firestore, 'sales', saleId);
          batch.update(saleRef, { customerId: null, customerName: '' });
        }
        await batch.commit();
      }
    }, {
      customerId,
    });
  }

  async softDelete(path: string, id: string): Promise<void> {
    await this.updateDocument(path, id, { active: false });
  }

  createDocumentId(path: string): string {
    return this.firestoreApi.doc(this.firestoreApi.collection(this.firestore, path)).id;
  }

  async registerSupplyPurchaseAtomic(
    input: SupplyPurchaseAtomicInput,
  ): Promise<{ expenseId: string; alreadyApplied: boolean }> {
    return this.runFirestoreOperation('register_supply_purchase_atomic', async () => {
      const expenseRef = this.firestoreApi.doc(this.firestore, 'supplyExpenses', input.expenseId);

      return this.firestoreApi.runTransaction(this.firestore, async (transaction) => {
        const existingExpense = await transaction.get(expenseRef);
        if (existingExpense.exists()) {
          return { expenseId: input.expenseId, alreadyApplied: true };
        }

        const entries = await Promise.all(
          input.items.map(async (item) => {
            const ref = this.firestoreApi.doc(this.firestore, 'ingredients', item.ingredientId);
            const snap = await transaction.get(ref);
            return { item, ref, snap };
          }),
        );

        transaction.set(expenseRef as DocumentReference, {
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
        });

        for (const { item, ref, snap } of entries) {
          if (!snap.exists()) {
            continue;
          }

          const currentStock = Number(snap.data()['currentStock'] ?? 0);
          const previousPrice = Number(snap.data()['unitPrice'] ?? 0);
          transaction.update(ref, {
            currentStock: currentStock + item.quantity,
            unitPrice: item.unitPrice,
            lastPurchase: input.date,
          });

          if (previousPrice !== item.unitPrice) {
            const priceHistoryRef = this.firestoreApi.doc(
              this.firestoreApi.collection(this.firestore, 'priceHistory'),
            );
            transaction.set(priceHistoryRef as DocumentReference, {
              ingredientId: item.ingredientId,
              ingredientName: item.ingredientName,
              previousPrice,
              newPrice: item.unitPrice,
              date: input.date,
            });
          }

          const movementRef = this.firestoreApi.doc(
            this.firestoreApi.collection(this.firestore, 'stockMovements'),
          );
          transaction.set(movementRef as DocumentReference, {
            ingredientId: item.ingredientId,
            ingredientName: item.ingredientName,
            type: 'purchase',
            quantity: item.quantity,
            date: input.date,
            saleId: null,
            expenseId: input.expenseId,
          });
        }

        return { expenseId: input.expenseId, alreadyApplied: false };
      });
    }, {
      expenseId: input.expenseId,
      itemCount: input.items.length,
    });
  }

  async applyStockAdjustments(
    saleId: string,
    movementType: 'sale_deduction' | 'cancellation_restock' | 'edit_restock' | 'edit_deduction',
    adjustments: StockAdjustmentInput[],
  ): Promise<void> {
    if (adjustments.length === 0) return;

    await this.runFirestoreOperation('apply_stock_adjustments', async () => {
      await this.firestoreApi.runTransaction(this.firestore, async (transaction) => {
        const now = this.firestoreApi.timestampNow();

        for (const adjustment of adjustments) {
          const ingredientRef = this.firestoreApi.doc(
            this.firestore,
            'ingredients',
            adjustment.ingredientId,
          );
          const ingredientSnap = await transaction.get(ingredientRef);
          if (!ingredientSnap.exists()) continue;

          const currentStock = Number(ingredientSnap.data()['currentStock'] ?? 0);
          const newStock = Math.max(0, currentStock + adjustment.delta);
          const appliedDelta = newStock - currentStock;

          transaction.update(ingredientRef, { currentStock: newStock });

          if (appliedDelta === 0) continue;

          const movementRef = this.firestoreApi.doc(
            this.firestoreApi.collection(this.firestore, 'stockMovements'),
          );
          transaction.set(movementRef, {
            ingredientId: adjustment.ingredientId,
            ingredientName: adjustment.ingredientName,
            type: movementType,
            quantity: appliedDelta,
            date: now,
            saleId,
          });
        }
      });
    }, {
      saleId,
      movementType,
      adjustmentCount: adjustments.length,
    });
  }

  private async runFirestoreOperation<T>(
    operation: string,
    run: () => Promise<T>,
    extra?: Record<string, unknown>,
  ): Promise<T> {
    try {
      return await run();
    } catch (error: unknown) {
      Sentry.captureException(error, {
        tags: {
          area: 'firestore',
          operation,
        },
        extra,
      });
      throw error;
    }
  }

  private serializeRecord(data: FirestoreData): Record<string, BackupJsonValue> {
    const entries: [string, BackupJsonValue][] = [];
    for (const [key, value] of Object.entries(data)) {
      if (!this.isSafeObjectKey(key)) {
        continue;
      }
      const nextValue = this.serializeValue(value);
      if (nextValue !== undefined) {
        entries.push([key, nextValue]);
      }
    }
    return Object.fromEntries(entries) as Record<string, BackupJsonValue>;
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

  private deserializeRecord(data: Record<string, BackupJsonValue>): FirestoreData {
    const entries: [string, unknown][] = [];
    for (const [key, value] of Object.entries(data)) {
      if (!this.isSafeObjectKey(key)) {
        continue;
      }
      entries.push([key, this.deserializeValue(value)]);
    }
    return Object.fromEntries(entries) as FirestoreData;
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
    const typedCollections = collections as UnknownBackupCollections;
    for (const collectionName of APP_DATA_COLLECTIONS) {
      const documents = this.getUnknownBackupDocuments(typedCollections, collectionName);
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

  private chunk<T>(items: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let index = 0; index < items.length; index += size) {
      chunks.push(items.slice(index, index + size));
    }
    return chunks;
  }

  private isRecord(value: unknown): value is Record<string, BackupJsonValue> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  private createEmptyBackupCollections(): BackupCollections {
    return {
      users: [],
      ingredients: [],
      recipes: [],
      customers: [],
      sales: [],
      priceHistory: [],
      stockMovements: [],
      supplyExpenses: [],
      fixedCostsByMonth: [],
    };
  }

  private setBackupDocuments(
    collections: BackupCollections,
    collectionName: (typeof APP_DATA_COLLECTIONS)[number],
    documents: BackupDocumentList,
  ): void {
    switch (collectionName) {
      case 'users':
        collections.users = documents;
        return;
      case 'ingredients':
        collections.ingredients = documents;
        return;
      case 'recipes':
        collections.recipes = documents;
        return;
      case 'customers':
        collections.customers = documents;
        return;
      case 'sales':
        collections.sales = documents;
        return;
      case 'priceHistory':
        collections.priceHistory = documents;
        return;
      case 'stockMovements':
        collections.stockMovements = documents;
        return;
      case 'supplyExpenses':
        collections.supplyExpenses = documents;
        return;
      case 'fixedCostsByMonth':
        collections.fixedCostsByMonth = documents;
        return;
    }
  }

  private getBackupDocuments(
    collections: AppBackupFile['collections'],
    collectionName: (typeof APP_DATA_COLLECTIONS)[number],
  ): BackupDocumentList {
    const typedCollections = collections as unknown as BackupCollections;
    switch (collectionName) {
      case 'users':
        return typedCollections.users;
      case 'ingredients':
        return typedCollections.ingredients;
      case 'recipes':
        return typedCollections.recipes;
      case 'customers':
        return typedCollections.customers;
      case 'sales':
        return typedCollections.sales;
      case 'priceHistory':
        return typedCollections.priceHistory;
      case 'stockMovements':
        return typedCollections.stockMovements;
      case 'supplyExpenses':
        return typedCollections.supplyExpenses;
      case 'fixedCostsByMonth':
        return typedCollections.fixedCostsByMonth;
    }
  }

  private getUnknownBackupDocuments(
    collections: UnknownBackupCollections,
    collectionName: (typeof APP_DATA_COLLECTIONS)[number],
  ): unknown {
    switch (collectionName) {
      case 'users':
        return collections.users;
      case 'ingredients':
        return collections.ingredients;
      case 'recipes':
        return collections.recipes;
      case 'customers':
        return collections.customers;
      case 'sales':
        return collections.sales;
      case 'priceHistory':
        return collections.priceHistory;
      case 'stockMovements':
        return collections.stockMovements;
      case 'supplyExpenses':
        return collections.supplyExpenses;
      case 'fixedCostsByMonth':
        return collections.fixedCostsByMonth;
    }
  }

  private isSafeObjectKey(key: string): boolean {
    return key !== '__proto__' && key !== 'prototype' && key !== 'constructor';
  }
}
