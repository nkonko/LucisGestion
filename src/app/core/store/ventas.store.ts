import { computed, inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { FirestoreService } from '../services/firestore.service';
import { StockAdjustmentInput } from '../models/stock-adjustment.model';
import { Venta, VentaInput } from '../models/venta.model';
import { orderBy } from '@angular/fire/firestore';
import { toSignal } from '@angular/core/rxjs-interop';
import { IngredientesStore } from './ingredientes.store';
import { RecetasStore } from './recetas.store';
import { BaseState } from '../interfaces/state';

export const VentasStore = signalStore(
  { providedIn: 'root' },
  withState<BaseState>({ loading: false, error: null }),

  withMethods((store) => {
    const fs = inject(FirestoreService);
    const ingredientesStore = inject(IngredientesStore);
    const recetasStore = inject(RecetasStore);

    const ventas$ = fs.getCollection<Venta>('ventas', orderBy('fecha', 'desc'));
    const ventas = toSignal(ventas$, { initialValue: [] as Venta[] });

    const pedidosPendientes = computed(() => ventas().filter((v) => v.estado === 'pendiente'));

    const buildStockAdjustments = (
      items: Array<{ recetaId: string; cantidad: number }>,
      factor: -1 | 1,
    ): StockAdjustmentInput[] => {
      const adjustmentsByIngrediente = new Map<string, StockAdjustmentInput>();

      for (const item of items) {
        const receta = recetasStore.recetas().find((r) => r.id === item.recetaId);
        if (!receta) continue;

        for (const ri of receta.ingredientes) {
          const delta = ri.cantidad * item.cantidad * factor;
          if (delta === 0) continue;

          const current = adjustmentsByIngrediente.get(ri.ingredienteId);
          if (current) {
            current.delta += delta;
            continue;
          }

          const ingredienteNombre =
            ingredientesStore.ingredientes().find((i) => i.id === ri.ingredienteId)?.nombre ?? ri.nombre;

          adjustmentsByIngrediente.set(ri.ingredienteId, {
            ingredienteId: ri.ingredienteId,
            ingredienteNombre,
            delta,
          });
        }
      }

      return [...adjustmentsByIngrediente.values()];
    };

    return {
      ventas,
      pedidosPendientes,
      pedidosPendientesCount: computed(() => pedidosPendientes().length),
      ventasRecientes: computed(() => ventas().slice(0, 5)),

      async registrarVenta(venta: VentaInput) {
        patchState(store, { loading: true, error: null });
        try {
          const ventaId = await fs.addDocument<VentaInput>('ventas', venta);

          const adjustments = buildStockAdjustments(venta.items, -1);
          await fs.applyStockAdjustments(ventaId, 'venta_deduccion', adjustments);

          patchState(store, { loading: false });
          return ventaId;
        } catch (e: any) {
          patchState(store, { loading: false, error: e.message });
          throw e;
        }
      },

      async actualizarEstadoVenta(id: string, estado: Venta['estado']) {
        patchState(store, { loading: true, error: null });
        try {
          await fs.updateDocument('ventas', id, { estado });

          if (estado === 'cancelado') {
            const venta = ventas().find((v) => v.id === id);
            if (venta) {
              const adjustments = buildStockAdjustments(venta.items, 1);
              await fs.applyStockAdjustments(id, 'cancelacion_reposicion', adjustments);
            }
          }

          patchState(store, { loading: false });
        } catch (e: any) {
          patchState(store, { loading: false, error: e.message });
          throw e;
        }
      },
    };
  }),
);
