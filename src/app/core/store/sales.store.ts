import { computed, inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
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

  withMethods((store) => {
    const fs = inject(FirestoreService);
    const ingredientsStore = inject(IngredientsStore);
    const recipesStore = inject(RecipesStore);

    const sales$ = fs.getCollection<Sale>('sales', orderBy('date', 'desc'));
    const sales = toSignal(sales$, { initialValue: [] as Sale[] });

    const pendingOrders = computed(() => sales().filter((v) => v.status === 'pending'));

    const buildStockAdjustments = (
      items: Array<{ recipeId: string; quantity: number }>,
      factor: -1 | 1,
    ): StockAdjustmentInput[] => {
      const adjustmentsByIngredient = new Map<string, StockAdjustmentInput>();

      for (const item of items) {
        const recipe = recipesStore.recipes().find((r) => r.id === item.recipeId);
        if (!recipe) continue;

        for (const ri of recipe.ingredients) {
          const delta = ri.quantity * item.quantity * factor;
          if (delta === 0) continue;

          const current = adjustmentsByIngredient.get(ri.ingredientId);
          if (current) {
            current.delta += delta;
            continue;
          }

          const ingredientName =
            ingredientsStore.ingredients().find((i) => i.id === ri.ingredientId)?.name ?? ri.name;

          adjustmentsByIngredient.set(ri.ingredientId, {
            ingredientId: ri.ingredientId,
            ingredientName,
            delta,
          });
        }
      }

      return [...adjustmentsByIngredient.values()];
    };

    return {
      sales,
      pendingOrders,
      pendingOrdersCount: computed(() => pendingOrders().length),
      recentSales: computed(() => sales().slice(0, 5)),

      async registerSale(sale: SaleInput) {
        patchState(store, { loading: true, error: null });
        try {
          const saleId = await fs.addDocument<SaleInput>('sales', sale);

          const adjustments = buildStockAdjustments(sale.items, -1);
          await fs.applyStockAdjustments(saleId, 'sale_deduction', adjustments);

          patchState(store, { loading: false });
          return saleId;
        } catch (e: any) {
          patchState(store, { loading: false, error: e.message });
          throw e;
        }
      },

      async updateSaleStatus(id: string, status: Sale['status']) {
        patchState(store, { loading: true, error: null });
        try {
          await fs.updateDocument('sales', id, { status });

          if (status === 'cancelled') {
            const sale = sales().find((v) => v.id === id);
            if (sale) {
              const adjustments = buildStockAdjustments(sale.items, 1);
              await fs.applyStockAdjustments(id, 'cancellation_restock', adjustments);
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
