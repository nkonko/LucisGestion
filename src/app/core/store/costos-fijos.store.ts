import { computed, inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { FirestoreService } from '../services/firestore.service';
import { CostoFijo, CostoFijoInput } from '../models/costo-fijo.model';
import { where, orderBy } from '@angular/fire/firestore';
import { toSignal } from '@angular/core/rxjs-interop';
import { BaseState } from '../interfaces/state';

export const CostosFijosStore = signalStore(
  { providedIn: 'root' },
  withState<BaseState>({ loading: false, error: null }),

  withMethods((store) => {
    const fs = inject(FirestoreService);

    const costosFijos$ = fs.getCollection<CostoFijo>(
      'costosFijos',
      where('activo', '==', true),
      orderBy('nombre', 'asc'),
    );
    const costosFijos = toSignal(costosFijos$, { initialValue: [] as CostoFijo[] });

    return {
      costosFijos,

      totalCostosFijosMensuales: computed(() =>
        costosFijos().reduce((sum, c) => {
          if (c.frecuencia === 'mensual') return sum + c.monto;
          if (c.frecuencia === 'semanal') return sum + c.monto * 4;
          return sum;
        }, 0),
      ),

      async crearCostoFijo(costoFijo: CostoFijoInput) {
        patchState(store, { loading: true, error: null });
        try {
          const id = await fs.addDocument<CostoFijoInput>('costosFijos', {
            ...costoFijo,
            activo: true,
          });
          patchState(store, { loading: false });
          return id;
        } catch (e: any) {
          patchState(store, { loading: false, error: e.message });
          throw e;
        }
      },

      async actualizarCostoFijo(id: string, changes: Partial<CostoFijo>) {
        patchState(store, { loading: true, error: null });
        try {
          await fs.updateDocument('costosFijos', id, changes as Record<string, any>);
          patchState(store, { loading: false });
        } catch (e: any) {
          patchState(store, { loading: false, error: e.message });
          throw e;
        }
      },

      async eliminarCostoFijo(id: string) {
        try {
          return await fs.softDelete('costosFijos', id);
        } catch (e: any) {
          patchState(store, { error: e.message });
          throw e;
        }
      },
    };
  }),
);
