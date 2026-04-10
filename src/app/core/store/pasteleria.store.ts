import { computed, inject } from '@angular/core';
import {
  signalStore,
  withState,
  withMethods,
  patchState,
} from '@ngrx/signals';
import { FirestoreService } from '../services/firestore.service';
import {
  Ingrediente,
  Receta,
  RecetaIngrediente,
  Venta,
  Cliente,
  MovimientoStock,
  GastoInsumo,
  HistorialPrecio,
} from '../models';
import { where, orderBy, Timestamp } from '@angular/fire/firestore';
import { toSignal } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';

// --- State shape ---
export type Periodo = 'hoy' | 'semana' | 'mes';

interface PasteleriaState {
  loading: boolean;
  error: string | null;
  periodoSeleccionado: Periodo;
}

const initialState: PasteleriaState = {
  loading: false,
  error: null,
  periodoSeleccionado: 'mes',
};

// --- Store ---
export const PasteleriaStore = signalStore(
  { providedIn: 'root' },

  withState(initialState),

  // Hook into Firestore real-time streams
  withMethods((store) => {
    const fs = inject(FirestoreService);

    // Real-time Firestore subscriptions as signals
    const ingredientes$ = fs.getCollection<Ingrediente>(
      'ingredientes',
      where('activo', '==', true),
      orderBy('nombre', 'asc')
    );
    const recetas$ = fs.getCollection<Receta>(
      'recetas',
      where('activo', '==', true),
      orderBy('nombre', 'asc')
    );
    const ventas$ = fs.getCollection<Venta>(
      'ventas',
      orderBy('fecha', 'desc')
    );
    const clientes$ = fs.getCollection<Cliente>(
      'clientes',
      orderBy('nombre', 'asc')
    );

    // Convert to signals (real-time sync from Firestore)
    const ingredientes = toSignal(ingredientes$, { initialValue: [] as Ingrediente[] });
    const recetas = toSignal(recetas$, { initialValue: [] as Receta[] });
    const ventas = toSignal(ventas$, { initialValue: [] as Venta[] });
    const clientes = toSignal(clientes$, { initialValue: [] as Cliente[] });

    // --- Pure calculation helpers ---
    function calcularCostoReceta(ingredientesReceta: RecetaIngrediente[]): number {
      const ingredientesActuales = ingredientes();
      let costoTotal = 0;
      for (const ri of ingredientesReceta) {
        const ing = ingredientesActuales.find(i => i.id === ri.ingredienteId);
        if (ing) {
          costoTotal += ri.cantidad * ing.precioUnitario;
        }
      }
      return Math.round(costoTotal * 100) / 100;
    }

    function calcularPrecioSugerido(costo: number, margenPorcentaje: number): number {
      return Math.ceil(costo * (1 + margenPorcentaje / 100));
    }

    // --- Period helpers ---
    function obtenerInicioPeriodo(periodo: Periodo): Date {
      const now = new Date();
      switch (periodo) {
        case 'hoy': return new Date(now.getFullYear(), now.getMonth(), now.getDate());
        case 'semana': {
          const d = new Date(now);
          d.setDate(d.getDate() - d.getDay());
          d.setHours(0, 0, 0, 0);
          return d;
        }
        case 'mes': return new Date(now.getFullYear(), now.getMonth(), 1);
      }
    }

    // --- Computed (derived state) ---
    const stockBajo = computed(() =>
      ingredientes().filter(i => i.stockActual <= i.stockMinimo)
    );

    const stockBajoCount = computed(() => stockBajo().length);

    const ventasPeriodo = computed(() => {
      const inicio = obtenerInicioPeriodo(store.periodoSeleccionado());
      return ventas().filter(v => v.fecha?.toDate() >= inicio);
    });

    const ventasMes = computed(() =>
      ventasPeriodo().reduce((sum, v) => sum + v.total, 0)
    );

    const gastosMes = computed(() =>
      ventasPeriodo().reduce((sum, v) => sum + v.costoTotal, 0)
    );

    const gananciaMes = computed(() =>
      ventasPeriodo().reduce((sum, v) => sum + v.ganancia, 0)
    );

    const pedidosPendientes = computed(() =>
      ventas().filter(v => v.estado === 'pendiente')
    );

    const pedidosPendientesCount = computed(() => pedidosPendientes().length);

    const ventasRecientes = computed(() => ventas().slice(0, 5));

    const totalRecetas = computed(() => recetas().length);

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

    const ingredientesOrdenadosPorStock = computed(() =>
      [...ingredientes()].sort((a, b) => {
        const scoreA = a.stockActual <= 0 ? 0 : a.stockActual <= a.stockMinimo ? 1 : 2;
        const scoreB = b.stockActual <= 0 ? 0 : b.stockActual <= b.stockMinimo ? 1 : 2;
        return scoreA - scoreB;
      })
    );

    return {
      // --- Entity signals (read-only) ---
      ingredientes,
      recetas,
      ventas,
      clientes,

      // --- Derived computed signals ---
      stockBajo,
      stockBajoCount,
      ventasMes,
      gastosMes,
      gananciaMes,
      pedidosPendientes,
      pedidosPendientesCount,
      ventasRecientes,
      totalRecetas,
      productoMasVendido,
      ingredientesOrdenadosPorStock,

      // --- Pure calculators ---
      calcularCostoReceta,
      calcularPrecioSugerido,

      // --- Period selection ---
      setPeriodo(periodo: Periodo) {
        patchState(store, { periodoSeleccionado: periodo });
      },

      // --- Ingredientes mutations ---
      async crearIngrediente(ingrediente: Omit<Ingrediente, 'id'>) {
        patchState(store, { loading: true, error: null });
        try {
          const id = await fs.addDocument('ingredientes', {
            ...ingrediente,
            activo: true,
          } as any);
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

          // Cascade: recalculate all recipes using this ingredient
          if (changes.precioUnitario !== undefined) {
            // Log price change
            const current = ingredientes().find(i => i.id === id);
            if (current && current.precioUnitario !== changes.precioUnitario) {
              await fs.addDocument('historialPrecios', {
                ingredienteId: id,
                ingredienteNombre: current.nombre,
                precioAnterior: current.precioUnitario,
                precioNuevo: changes.precioUnitario,
                fecha: Timestamp.now(),
              } as any);
            }

            await fs.updateDocument('ingredientes', id, {
              ultimaCompra: Timestamp.now(),
            });

            const afectadas = recetas().filter(r =>
              r.ingredientes.some(i => i.ingredienteId === id)
            );
            for (const receta of afectadas) {
              // Need to recalculate with NEW price — read from fresh signal after update
              const costoCalculado = calcularCostoReceta(receta.ingredientes);
              const precioSugerido = calcularPrecioSugerido(costoCalculado, receta.margenGanancia);
              await fs.updateDocument('recetas', receta.id!, { costoCalculado, precioSugerido });
            }
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

      // --- Recetas mutations ---
      async crearReceta(receta: Omit<Receta, 'id'>) {
        patchState(store, { loading: true, error: null });
        try {
          const costoCalculado = calcularCostoReceta(receta.ingredientes);
          const precioSugerido = calcularPrecioSugerido(costoCalculado, receta.margenGanancia);

          const id = await fs.addDocument('recetas', {
            ...receta,
            costoCalculado,
            precioSugerido,
            precioVenta: receta.precioVenta || precioSugerido,
            activo: true,
          } as any);
          patchState(store, { loading: false });
          return id;
        } catch (e: any) {
          patchState(store, { loading: false, error: e.message });
          throw e;
        }
      },

      async actualizarReceta(id: string, changes: Partial<Receta>) {
        patchState(store, { loading: true, error: null });
        try {
          if (changes.ingredientes || changes.margenGanancia !== undefined) {
            const current = recetas().find(r => r.id === id);
            const ings = changes.ingredientes ?? current?.ingredientes ?? [];
            const margen = changes.margenGanancia ?? current?.margenGanancia ?? 0;

            changes.costoCalculado = calcularCostoReceta(ings);
            changes.precioSugerido = calcularPrecioSugerido(changes.costoCalculado, margen);
          }
          await fs.updateDocument('recetas', id, changes as Record<string, any>);
          patchState(store, { loading: false });
        } catch (e: any) {
          patchState(store, { loading: false, error: e.message });
          throw e;
        }
      },

      async duplicarReceta(receta: Receta) {
        try {
          const { id, ...data } = receta;
          return await fs.addDocument('recetas', {
            ...data,
            nombre: `${data.nombre} (copia)`,
            activo: true,
          } as any);
        } catch (e: any) {
          patchState(store, { error: e.message });
          throw e;
        }
      },

      async eliminarReceta(id: string) {
        try {
          return await fs.softDelete('recetas', id);
        } catch (e: any) {
          patchState(store, { error: e.message });
          throw e;
        }
      },

      // --- Ventas mutations (with stock deduction) ---
      async registrarVenta(venta: Omit<Venta, 'id'>) {
        patchState(store, { loading: true, error: null });
        try {
          // 1. Save the sale
          const ventaId = await fs.addDocument('ventas', venta as any);

          // 2. Deduct stock for each sold item
          for (const item of venta.items) {
            const receta = recetas().find(r => r.id === item.recetaId);
            if (!receta) continue;

            for (const ri of receta.ingredientes) {
              const cantidadDeducir = ri.cantidad * item.cantidad;
              const ingrediente = ingredientes().find(i => i.id === ri.ingredienteId);
              if (!ingrediente) continue;

              const nuevoStock = Math.max(0, ingrediente.stockActual - cantidadDeducir);
              await fs.updateDocument('ingredientes', ri.ingredienteId, {
                stockActual: nuevoStock,
              });

              // Register stock movement
              await fs.addDocument('movimientosStock', {
                ingredienteId: ri.ingredienteId,
                ingredienteNombre: ingrediente.nombre,
                tipo: 'venta_deduccion',
                cantidad: -cantidadDeducir,
                fecha: Timestamp.now(),
                ventaId,
              } as any);
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

          // Reponer stock si se cancela la venta
          if (estado === 'cancelado') {
            const venta = ventas().find(v => v.id === id);
            if (venta) {
              for (const item of venta.items) {
                const receta = recetas().find(r => r.id === item.recetaId);
                if (!receta) continue;

                for (const ri of receta.ingredientes) {
                  const cantidadReponer = ri.cantidad * item.cantidad;
                  const ingrediente = ingredientes().find(i => i.id === ri.ingredienteId);
                  if (!ingrediente) continue;

                  const nuevoStock = ingrediente.stockActual + cantidadReponer;
                  await fs.updateDocument('ingredientes', ri.ingredienteId, {
                    stockActual: nuevoStock,
                  });

                  await fs.addDocument('movimientosStock', {
                    ingredienteId: ri.ingredienteId,
                    ingredienteNombre: ingrediente.nombre,
                    tipo: 'cancelacion_reposicion',
                    cantidad: cantidadReponer,
                    fecha: Timestamp.now(),
                    ventaId: id,
                  } as any);
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

      // --- Clientes mutations ---
      async crearCliente(cliente: Omit<Cliente, 'id'>) {
        try {
          return await fs.addDocument('clientes', cliente as any);
        } catch (e: any) {
          patchState(store, { error: e.message });
          throw e;
        }
      },

      async actualizarCliente(id: string, changes: Partial<Cliente>) {
        try {
          return await fs.updateDocument('clientes', id, changes as Record<string, any>);
        } catch (e: any) {
          patchState(store, { error: e.message });
          throw e;
        }
      },

      /** Get price history for an ingredient */
      getHistorialPrecios(ingredienteId: string): Observable<HistorialPrecio[]> {
        return fs.getCollection<HistorialPrecio>(
          'historialPrecios',
          where('ingredienteId', '==', ingredienteId),
          orderBy('fecha', 'desc')
        );
      },

      // --- Compra de insumos ---
      async registrarCompraInsumos(gasto: Omit<GastoInsumo, 'id'>) {
        patchState(store, { loading: true, error: null });
        try {
          const gastoId = await fs.addDocument('gastosInsumos', gasto as any);

          for (const item of gasto.items) {
            const ingrediente = ingredientes().find(i => i.id === item.ingredienteId);
            if (!ingrediente) continue;

            const nuevoStock = ingrediente.stockActual + item.cantidad;
            await fs.updateDocument('ingredientes', item.ingredienteId, {
              stockActual: nuevoStock,
              precioUnitario: item.precioUnitario,
              ultimaCompra: Timestamp.now(),
            });

            await fs.addDocument('movimientosStock', {
              ingredienteId: item.ingredienteId,
              ingredienteNombre: ingrediente.nombre,
              tipo: 'compra',
              cantidad: item.cantidad,
              fecha: Timestamp.now(),
              gastoId,
            } as any);
          }

          patchState(store, { loading: false });
          return gastoId;
        } catch (e: any) {
          patchState(store, { loading: false, error: e.message });
          throw e;
        }
      },
    };
  }),
);
