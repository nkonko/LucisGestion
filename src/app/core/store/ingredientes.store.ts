import { computed, inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { FirestoreService } from '../services/firestore.service';
import {
  Ingrediente,
  HistorialPrecio,
  IngredienteInput,
  MovimientoStockInput,
} from '../models/ingrediente.model';
import { GastoInsumo, GastoInsumoInput } from '../models/gasto-insumo.model';
import { where, orderBy, Timestamp } from '@angular/fire/firestore';
import { toSignal } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import { BaseState } from '../interfaces/state';

export const IngredientesStore = signalStore(
  { providedIn: 'root' },
  withState<BaseState>({ loading: false, error: null }),

  withMethods((store) => {
    const fs = inject(FirestoreService);

    const ingredientes$ = fs.getCollection<Ingrediente>(
      'ingredientes',
      where('activo', '==', true),
      orderBy('nombre', 'asc'),
    );
    const ingredientes = toSignal(ingredientes$, { initialValue: [] as Ingrediente[] });

    const stockBajo = computed(() => ingredientes().filter((i) => i.stockActual <= i.stockMinimo));

    return {
      ingredientes,
      stockBajo,
      stockBajoCount: computed(() => stockBajo().length),
      ingredientesOrdenadosPorStock: computed(() =>
        [...ingredientes()].sort((a, b) => {
          const scoreA = a.stockActual <= 0 ? 0 : a.stockActual <= a.stockMinimo ? 1 : 2;
          const scoreB = b.stockActual <= 0 ? 0 : b.stockActual <= b.stockMinimo ? 1 : 2;
          return scoreA - scoreB;
        }),
      ),

      async crearIngrediente(ingrediente: IngredienteInput) {
        patchState(store, { loading: true, error: null });
        try {
          const id = await fs.addDocument('ingredientes', {
            ...ingrediente,
            activo: true,
          } as IngredienteInput);
          patchState(store, { loading: false });
          return id;
        } catch (e: any) {
          patchState(store, { loading: false, error: e.message });
          throw e;
        }
      },

      async actualizarIngrediente(id: string, changes: Partial<Ingrediente>) {
        patchState(store, { loading: true, error: null });
        try {
          await fs.updateDocument('ingredientes', id, changes as Record<string, any>);

          // Registrar historial si cambió el precio
          if (changes.precioUnitario !== undefined) {
            const current = ingredientes().find((i) => i.id === id);
            if (current && current.precioUnitario !== changes.precioUnitario) {
              await fs.addDocument('historialPrecios', {
                ingredienteId: id,
                ingredienteNombre: current.nombre,
                precioAnterior: current.precioUnitario,
                precioNuevo: changes.precioUnitario,
                fecha: Timestamp.now(),
              } as HistorialPrecio);
            }

            await fs.updateDocument('ingredientes', id, {
              ultimaCompra: Timestamp.now(),
            });
          }

          patchState(store, { loading: false });
        } catch (e: any) {
          patchState(store, { loading: false, error: e.message });
          throw e;
        }
      },

      async eliminarIngrediente(id: string) {
        try {
          return await fs.softDelete('ingredientes', id);
        } catch (e: any) {
          patchState(store, { error: e.message });
          throw e;
        }
      },

      async registrarCompraInsumos(gasto: GastoInsumoInput) {
        patchState(store, { loading: true, error: null });
        try {
          const gastoId = await fs.addDocument('gastosInsumos', gasto as GastoInsumoInput);

          for (const item of gasto.items) {
            const ingrediente = ingredientes().find((i) => i.id === item.ingredienteId);
            if (!ingrediente) continue;

            const nuevoStock = ingrediente.stockActual + item.cantidad;
            await fs.updateDocument('ingredientes', item.ingredienteId, {
              stockActual: nuevoStock,
              precioUnitario: item.precioUnitario,
              ultimaCompra: Timestamp.now(),
            });

            await fs.addDocument<MovimientoStockInput>('movimientosStock', {
              ingredienteId: item.ingredienteId,
              ingredienteNombre: ingrediente.nombre,
              tipo: 'compra',
              cantidad: item.cantidad,
              fecha: Timestamp.now(),
              ventaId: null,
            });
          }

          patchState(store, { loading: false });
          return gastoId;
        } catch (e: any) {
          patchState(store, { loading: false, error: e.message });
          throw e;
        }
      },

      getHistorialPrecios(ingredienteId: string): Observable<HistorialPrecio[]> {
        return fs.getCollection<HistorialPrecio>(
          'historialPrecios',
          where('ingredienteId', '==', ingredienteId),
          orderBy('fecha', 'desc'),
        );
      },
    };
  }),
);
