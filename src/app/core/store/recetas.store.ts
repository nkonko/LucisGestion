import { computed, inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { FirestoreService } from '../services/firestore.service';
import { Receta, RecetaInput } from '../models/receta.model';
import { where, orderBy } from '@angular/fire/firestore';
import { toSignal } from '@angular/core/rxjs-interop';
import { IngredientesStore } from './ingredientes.store';
import { calcularCostoReceta, calcularPrecioSugerido } from '../utils/precio.utils';
import { BaseState } from '../interfaces/state';

export const RecetasStore = signalStore(
  { providedIn: 'root' },
  withState<BaseState>({ loading: false, error: null }),

  withMethods((store) => {
    const fs = inject(FirestoreService);
    const ingredientesStore = inject(IngredientesStore);

    const recetas$ = fs.getCollection<Receta>(
      'recetas',
      where('activo', '==', true),
      orderBy('nombre', 'asc'),
    );
    const recetas = toSignal(recetas$, { initialValue: [] as Receta[] });

    return {
      recetas,
      totalRecetas: computed(() => recetas().length),

      async crearReceta(receta: RecetaInput) {
        patchState(store, { loading: true, error: null });
        try {
          const costoCalculado = calcularCostoReceta(
            receta.ingredientes,
            ingredientesStore.ingredientes(),
          );
          const precioSugerido = calcularPrecioSugerido(costoCalculado, receta.margenGanancia);

          const id = await fs.addDocument('recetas', {
            ...receta,
            costoCalculado,
            precioSugerido,
            precioVenta: receta.precioVenta || precioSugerido,
            activo: true,
          } as RecetaInput);
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
            const current = recetas().find((r) => r.id === id);
            const ings = changes.ingredientes ?? current?.ingredientes ?? [];
            const margen = changes.margenGanancia ?? current?.margenGanancia ?? 0;

            changes.costoCalculado = calcularCostoReceta(ings, ingredientesStore.ingredientes());
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
          } as RecetaInput);
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

      /** Recalcula costos de todas las recetas que usan un ingrediente dado */
      async recalcularPorCambioIngrediente(ingredienteId: string) {
        const afectadas = recetas().filter((r) =>
          r.ingredientes.some((i) => i.ingredienteId === ingredienteId),
        );
        for (const receta of afectadas) {
          const costoCalculado = calcularCostoReceta(
            receta.ingredientes,
            ingredientesStore.ingredientes(),
          );
          const precioSugerido = calcularPrecioSugerido(costoCalculado, receta.margenGanancia);
          await fs.updateDocument('recetas', receta.id!, { costoCalculado, precioSugerido });
        }
      },
    };
  }),
);
