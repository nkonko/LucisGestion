import { Injectable, InjectionToken, inject } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  addDoc,
  deleteDoc,
  updateDoc,
  query,
  runTransaction,
  Timestamp,
  CollectionReference,
  QueryConstraint,
  DocumentReference,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { StockAdjustmentInput, SupplyPurchaseAtomicInput } from '../models/stock';
export type { StockAdjustmentInput, SupplyPurchaseAtomicInput };

interface FirestoreApi {
  addDoc: typeof addDoc;
  collection: typeof collection;
  collectionData: typeof collectionData;
  deleteDoc: typeof deleteDoc;
  doc: typeof doc;
  query: typeof query;
  runTransaction: typeof runTransaction;
  timestampNow: typeof Timestamp.now;
  updateDoc: typeof updateDoc;
}

export const FIRESTORE_API = new InjectionToken<FirestoreApi>('Firestore API', {
  providedIn: 'root',
  factory: () => ({
    addDoc,
    collection,
    collectionData,
    deleteDoc,
    doc,
    query,
    runTransaction,
    timestampNow: Timestamp.now,
    updateDoc,
  }),
});

@Injectable({ providedIn: 'root' })
export class FirestoreService {
  private firestore = inject(Firestore);
  private firestoreApi = inject(FIRESTORE_API);

  getCollection<T extends { id?: string }>(path: string, ...constraints: QueryConstraint[]): Observable<T[]> {
    const ref = this.firestoreApi.collection(this.firestore, path) as CollectionReference<T>;
    const q = constraints.length > 0 ? this.firestoreApi.query(ref, ...constraints) : ref;
    return this.firestoreApi.collectionData(q, { idField: 'id' }) as Observable<T[]>;
  }

  async addDocument<T extends object>(path: string, data: T): Promise<string> {
    const ref = this.firestoreApi.collection(this.firestore, path);
    const { id: _, ...dataWithoutId } = data as T & { id?: unknown };
    const docRef = await this.firestoreApi.addDoc(ref, dataWithoutId as Record<string, unknown>);
    return docRef.id;
  }

  async updateDocument(path: string, id: string, data: Record<string, unknown>): Promise<void> {
    const ref = this.firestoreApi.doc(this.firestore, path, id);
    const { id: _, ...dataWithoutId } = data;
    await this.firestoreApi.updateDoc(ref, dataWithoutId);
  }

  async deleteDocument(path: string, id: string): Promise<void> {
    const ref = this.firestoreApi.doc(this.firestore, path, id);
    await this.firestoreApi.deleteDoc(ref);
  }

  async softDelete(path: string, id: string): Promise<void> {
    await this.updateDocument(path, id, { active: false });
  }

  createDocumentId(path: string): string {
    return this.firestoreApi.doc(this.firestoreApi.collection(this.firestore, path)).id;
  }

  async registerSupplyPurchaseAtomic(input: SupplyPurchaseAtomicInput): Promise<{ expenseId: string; alreadyApplied: boolean }> {
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
        transaction.update(ref, {
          currentStock: currentStock + item.quantity,
          unitPrice: item.unitPrice,
          lastPurchase: input.date,
        });

        const movementRef = this.firestoreApi.doc(this.firestoreApi.collection(this.firestore, 'stockMovements'));
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
  }

  async applyStockAdjustments(
    saleId: string,
    movementType: 'sale_deduction' | 'cancellation_restock' | 'edit_restock' | 'edit_deduction',
    adjustments: StockAdjustmentInput[],
  ): Promise<void> {
    if (adjustments.length === 0) return;

    await this.firestoreApi.runTransaction(this.firestore, async (transaction) => {
      const now = this.firestoreApi.timestampNow();

      for (const adjustment of adjustments) {
        const ingredientRef = this.firestoreApi.doc(this.firestore, 'ingredients', adjustment.ingredientId);
        const ingredientSnap = await transaction.get(ingredientRef);
        if (!ingredientSnap.exists()) continue;

        const currentStock = Number(ingredientSnap.data()['currentStock'] ?? 0);
        const newStock = Math.max(0, currentStock + adjustment.delta);
        const appliedDelta = newStock - currentStock;

        transaction.update(ingredientRef, { currentStock: newStock });

        if (appliedDelta === 0) continue;

        const movementRef = this.firestoreApi.doc(this.firestoreApi.collection(this.firestore, 'stockMovements'));
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
  }
}
