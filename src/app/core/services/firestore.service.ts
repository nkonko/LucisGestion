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
import { StockAdjustmentInput } from '../models/stock-adjustment.model';
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
    await this.updateDocument(path, id, { activo: false });
  }

  async applyStockAdjustments(
    ventaId: string,
    tipoMovimiento: 'venta_deduccion' | 'cancelacion_reposicion',
    adjustments: StockAdjustmentInput[],
  ): Promise<void> {
    if (adjustments.length === 0) return;

    await runTransaction(this.firestore, async (transaction) => {
      const now = Timestamp.now();

      for (const adjustment of adjustments) {
        const ingredienteRef = doc(this.firestore, 'ingredientes', adjustment.ingredienteId);
        const ingredienteSnap = await transaction.get(ingredienteRef);
        if (!ingredienteSnap.exists()) continue;

        const stockActual = Number(ingredienteSnap.data()['stockActual'] ?? 0);
        const nuevoStock = Math.max(0, stockActual + adjustment.delta);
        const deltaAplicado = nuevoStock - stockActual;

        transaction.update(ingredienteRef, { stockActual: nuevoStock });

        if (deltaAplicado === 0) continue;

        const movimientoRef = doc(collection(this.firestore, 'movimientosStock'));
        transaction.set(movimientoRef, {
          ingredienteId: adjustment.ingredienteId,
          ingredienteNombre: adjustment.ingredienteNombre,
          tipo: tipoMovimiento,
          cantidad: deltaAplicado,
          fecha: now,
          ventaId,
        });
      }
    });
  }
}
