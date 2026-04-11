import { computed, inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { FirestoreService } from '../services/firestore.service';
import { Venta, VentaInput } from '../models/venta.model';
import { MovimientoStock, MovimientoStockInput } from '../models/ingrediente.model';
import { orderBy, Timestamp } from '@angular/fire/firestore';
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

    return {
      ventas,
      pedidosPendientes,
      pedidosPendientesCount: computed(() => pedidosPendientes().length),
      ventasRecientes: computed(() => ventas().slice(0, 5)),

      async registrarVenta(venta: VentaInput) {
        patchState(store, { loading: true, error: null });
        try {
          const ventaId = await fs.addDocument<VentaInput>('ventas', venta);

          for (const item of venta.items) {
            const receta = recetasStore.recetas().find((r) => r.id === item.recetaId);
            if (!receta) continue;

            for (const ri of receta.ingredientes) {
              const cantidadDeducir = ri.cantidad * item.cantidad;
              const ingrediente = ingredientesStore
                .ingredientes()
                .find((i) => i.id === ri.ingredienteId);
              if (!ingrediente) continue;

              const nuevoStock = Math.max(0, ingrediente.stockActual - cantidadDeducir);
              await fs.updateDocument('ingredientes', ri.ingredienteId, {
                stockActual: nuevoStock,
              });

              const movimiento: MovimientoStockInput = {
                ingredienteId: ri.ingredienteId,
                ingredienteNombre: ingrediente.nombre,
                tipo: 'venta_deduccion',
                cantidad: -cantidadDeducir,
                fecha: Timestamp.now(),
                ventaId,
              };
              await fs.addDocument<MovimientoStockInput>('movimientosStock', movimiento);
            }
          }

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
              for (const item of venta.items) {
                const receta = recetasStore.recetas().find((r) => r.id === item.recetaId);
                if (!receta) continue;

                for (const ri of receta.ingredientes) {
                  const cantidadReponer = ri.cantidad * item.cantidad;
                  const ingrediente = ingredientesStore
                    .ingredientes()
                    .find((i) => i.id === ri.ingredienteId);
                  if (!ingrediente) continue;

                  const nuevoStock = ingrediente.stockActual + cantidadReponer;
                  await fs.updateDocument('ingredientes', ri.ingredienteId, {
                    stockActual: nuevoStock,
                  });

                  const movimiento: MovimientoStockInput = {
                    ingredienteId: ri.ingredienteId,
                    ingredienteNombre: ingrediente.nombre,
                    tipo: 'cancelacion_reposicion',
                    cantidad: cantidadReponer,
                    fecha: Timestamp.now(),
                    ventaId: id,
                  };
                  await fs.addDocument<MovimientoStockInput>('movimientosStock', movimiento);
                }
              }
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
