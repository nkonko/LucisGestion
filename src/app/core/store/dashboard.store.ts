import { computed, inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { VentasStore } from './ventas.store';
import { CostosFijosStore } from './costos-fijos.store';
import { DashboardState } from './state/dashboard.state';
import { obtenerInicioPeriodo } from '../utils/dashboard.utils';
import { Periodo } from '../models/dashboard';

export const DashboardStore = signalStore(
  { providedIn: 'root' },
  withState<DashboardState>({ periodoSeleccionado: 'mes' }),

  withMethods((store) => {
    const ventasStore = inject(VentasStore);
    const costosFijosStore = inject(CostosFijosStore);

    const ventasPeriodo = computed(() => {
      const inicio = obtenerInicioPeriodo(store.periodoSeleccionado());
      return ventasStore.ventas().filter((v) => v.fecha?.toDate() >= inicio);
    });

    const ventasMes = computed(() => ventasPeriodo().reduce((sum, v) => sum + v.total, 0));

    const gastosMes = computed(() => ventasPeriodo().reduce((sum, v) => sum + v.costoTotal, 0));

    const gananciaMes = computed(() => ventasPeriodo().reduce((sum, v) => sum + v.ganancia, 0));

    const costosFijosPeriodo = computed(() => costosFijosStore.totalCostosFijosMensuales());

    const gastosTotalesPeriodo = computed(() => gastosMes() + costosFijosPeriodo());

    const gananciaNeta = computed(() => gananciaMes() - costosFijosPeriodo());

    const productoMasVendido = computed(() => {
      const vp = ventasPeriodo();
      if (!vp.length) return null;
      const conteo: Record<string, { nombre: string; cantidad: number }> = {};
      for (const v of vp) {
        for (const item of v.items) {
          if (!conteo[item.recetaId]) {
            conteo[item.recetaId] = { nombre: item.nombre, cantidad: 0 };
          }
          conteo[item.recetaId].cantidad += item.cantidad;
        }
      }
      return Object.values(conteo).sort((a, b) => b.cantidad - a.cantidad)[0] ?? null;
    });

    return {
      ventasMes,
      gastosMes,
      gananciaMes,
      costosFijosPeriodo,
      gastosTotalesPeriodo,
      gananciaNeta,
      productoMasVendido,

      setPeriodo(periodo: Periodo) {
        patchState(store, { periodoSeleccionado: periodo });
      },
    };
  }),
);
