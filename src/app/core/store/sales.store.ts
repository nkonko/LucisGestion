import { computed, inject } from '@angular/core';
import { signalStore, withState, withComputed, withMethods, patchState } from '@ngrx/signals';
import { FirestoreService } from '../services/firestore.service';
import { StockAdjustmentInput } from '../models/stock';
import { Sale, SaleInput } from '../models/sale';
import { orderBy } from '@angular/fire/firestore';
import { toSignal } from '@angular/core/rxjs-interop';
import { IngredientsStore } from './ingredients.store';
import { RecipesStore } from './recipes.store';
import { BaseState } from './state/state';

export const SalesStore = signalStore(
  { providedIn: 'root' },
  withState<BaseState>({ loading: false, error: null }),

  withComputed(() => {
    const fs = inject(FirestoreService);
    const sales$ = fs.getCollection<Sale>('sales', orderBy('date', 'desc'));
    const sales = toSignal(sales$, { initialValue: [] as Sale[] });
    const pendingOrders = computed(() => sales().filter((sale) => sale.status === 'pending'));

    return {
      sales,
      pendingOrders,
      pendingOrdersCount: computed(() => pendingOrders().length),
      recentSales: computed(() => sales().slice(0, 5)),
    };
  }),

  withMethods((store) => {
    const fs = inject(FirestoreService);
    const ingredientsStore = inject(IngredientsStore);
    const recipesStore = inject(RecipesStore);

    const buildStockAdjustments = (
      items: { recipeId: string; quantity: number }[],
      factor: -1 | 1,
    ): StockAdjustmentInput[] => {
      const adjustmentsByIngredient = new Map<string, StockAdjustmentInput>();

      for (const item of items) {
        const recipe = recipesStore.recipes().find((candidate) => candidate.id === item.recipeId);
        if (!recipe) continue;

        for (const recipeIngredient of recipe.ingredients) {
          const delta = recipeIngredient.quantity * item.quantity * factor;
          if (delta === 0) continue;

          const current = adjustmentsByIngredient.get(recipeIngredient.ingredientId);
          if (current) {
            current.delta += delta;
            continue;
          }

          const ingredientName =
            ingredientsStore.ingredients().find((ingredient) => ingredient.id === recipeIngredient.ingredientId)?.name ?? recipeIngredient.name;

          adjustmentsByIngredient.set(recipeIngredient.ingredientId, {
            ingredientId: recipeIngredient.ingredientId,
            ingredientName,
            delta,
          });
        }
      }

      return [...adjustmentsByIngredient.values()];
    };

    const handleStoreError = (cause: unknown): never => {
      const error = cause instanceof Error ? cause : new Error(String(cause));
      patchState(store, { loading: false, error: error.message });
      throw error;
    };

    return {
      async registerSale(sale: SaleInput) {
        patchState(store, { loading: true, error: null });
        try {
          const saleId = await fs.addDocument<SaleInput>('sales', sale);

          const adjustments = buildStockAdjustments(sale.items, -1);
          await fs.applyStockAdjustments(saleId, 'sale_deduction', adjustments);

          patchState(store, { loading: false });
          return saleId;
        } catch (error: unknown) {
          return handleStoreError(error);
        }
      },

      async updateSaleStatus(id: string, status: Sale['status']) {
        patchState(store, { loading: true, error: null });
        try {
          await fs.updateDocument('sales', id, { status });

          if (status === 'cancelled') {
            const sale = store.sales().find((candidate) => candidate.id === id);
            if (sale) {
              const adjustments = buildStockAdjustments(sale.items, 1);
              await fs.applyStockAdjustments(id, 'cancellation_restock', adjustments);
            }
          }

          patchState(store, { loading: false });
        } catch (error: unknown) {
          return handleStoreError(error);
        }
      },
    };
  }),
);
