import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  addDoc,
  updateDoc,
  query,
  runTransaction,
  Timestamp,
  CollectionReference,
  QueryConstraint,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { StockAdjustmentInput } from '../models/stock';
export type { StockAdjustmentInput };

@Injectable({ providedIn: 'root' })
export class FirestoreService {
  private firestore = inject(Firestore);

  getCollection<T>(path: string, ...constraints: QueryConstraint[]): Observable<T[]> {
    const ref = collection(this.firestore, path) as CollectionReference<T>;
    const q = constraints.length > 0 ? query(ref, ...constraints) : ref;
    return collectionData(q, { idField: 'id' as any }) as Observable<T[]>;
  }

  async addDocument<T extends Record<string, any>>(path: string, data: T): Promise<string> {
    const ref = collection(this.firestore, path);
    const { id, ...dataWithoutId } = data;
    const docRef = await addDoc(ref, dataWithoutId);
    return docRef.id;
  }

  async updateDocument(path: string, id: string, data: Record<string, any>): Promise<void> {
    const ref = doc(this.firestore, path, id);
    const { id: _, ...dataWithoutId } = data;
    await updateDoc(ref, dataWithoutId);
  }

  async softDelete(path: string, id: string): Promise<void> {
    await this.updateDocument(path, id, { active: false });
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
        const ingredientRef = doc(this.firestore, 'ingredientes', adjustment.ingredientId);
        const ingredientSnap = await transaction.get(ingredientRef);
        if (!ingredientSnap.exists()) continue;

        const currentStock = Number(ingredientSnap.data()['currentStock'] ?? 0);
        const newStock = Math.max(0, currentStock + adjustment.delta);
        const appliedDelta = newStock - currentStock;

        transaction.update(ingredientRef, { currentStock: newStock });

        if (appliedDelta === 0) continue;

        const movementRef = doc(collection(this.firestore, 'movimientosStock'));
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
