import { Injectable, inject } from '@angular/core';
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

@Injectable({ providedIn: 'root' })
export class FirestoreService {
  private firestore = inject(Firestore);

  getCollection<T extends { id?: string }>(path: string, ...constraints: QueryConstraint[]): Observable<T[]> {
    const ref = collection(this.firestore, path) as CollectionReference<T>;
    const q = constraints.length > 0 ? query(ref, ...constraints) : ref;
    return collectionData(q, { idField: 'id' }) as Observable<T[]>;
  }

  async addDocument<T extends object>(path: string, data: T): Promise<string> {
    const ref = collection(this.firestore, path);
    const { id: _, ...dataWithoutId } = data as T & { id?: unknown };
    const docRef = await addDoc(ref, dataWithoutId as Record<string, unknown>);
    return docRef.id;
  }

  async updateDocument(path: string, id: string, data: Record<string, unknown>): Promise<void> {
    const ref = doc(this.firestore, path, id);
    const { id: _, ...dataWithoutId } = data;
    await updateDoc(ref, dataWithoutId);
  }

  async deleteDocument(path: string, id: string): Promise<void> {
    const ref = doc(this.firestore, path, id);
    await deleteDoc(ref);
  }

  async softDelete(path: string, id: string): Promise<void> {
    await this.updateDocument(path, id, { active: false });
  }

  createDocumentId(path: string): string {
    return doc(collection(this.firestore, path)).id;
  }

  async registerSupplyPurchaseAtomic(input: SupplyPurchaseAtomicInput): Promise<{ expenseId: string; alreadyApplied: boolean }> {
    const expenseRef = doc(this.firestore, 'supplyExpenses', input.expenseId);

    return runTransaction(this.firestore, async (transaction) => {
      const existingExpense = await transaction.get(expenseRef);
      if (existingExpense.exists()) {
        return { expenseId: input.expenseId, alreadyApplied: true };
      }

      const entries = await Promise.all(
        input.items.map(async (item) => {
          const ref = doc(this.firestore, 'ingredients', item.ingredientId);
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

        const movementRef = doc(collection(this.firestore, 'stockMovements'));
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
    movementType: 'sale_deduction' | 'cancellation_restock',
    adjustments: StockAdjustmentInput[],
  ): Promise<void> {
    if (adjustments.length === 0) return;

    await runTransaction(this.firestore, async (transaction) => {
      const now = Timestamp.now();

      for (const adjustment of adjustments) {
        const ingredientRef = doc(this.firestore, 'ingredients', adjustment.ingredientId);
        const ingredientSnap = await transaction.get(ingredientRef);
        if (!ingredientSnap.exists()) continue;

        const currentStock = Number(ingredientSnap.data()['currentStock'] ?? 0);
        const newStock = Math.max(0, currentStock + adjustment.delta);
        const appliedDelta = newStock - currentStock;

        transaction.update(ingredientRef, { currentStock: newStock });

        if (appliedDelta === 0) continue;

        const movementRef = doc(collection(this.firestore, 'stockMovements'));
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
