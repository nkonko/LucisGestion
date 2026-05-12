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

    type RequiredIngredient = {
      ingredientName: string;
      required: number;
    };

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

    const getRequiredIngredients = (
      items: { recipeId: string; quantity: number }[],
    ): Map<string, RequiredIngredient> => {
      const requiredByIngredient = new Map<string, RequiredIngredient>();

      for (const item of items) {
        const recipe = recipesStore.recipes().find((candidate) => candidate.id === item.recipeId);
        if (!recipe) continue;

        for (const recipeIngredient of recipe.ingredients) {
          const requiredQuantity = recipeIngredient.quantity * item.quantity;
          const current = requiredByIngredient.get(recipeIngredient.ingredientId);

          if (current) {
            current.required += requiredQuantity;
            continue;
          }

          requiredByIngredient.set(recipeIngredient.ingredientId, {
            ingredientName: recipeIngredient.name,
            required: requiredQuantity,
          });
        }
      }

      return requiredByIngredient;
    };

    const throwIfInsufficientForCreation = (items: { recipeId: string; quantity: number }[]): void => {
      const requiredByIngredient = getRequiredIngredients(items);
      const shortages: string[] = [];

      for (const [ingredientId, required] of requiredByIngredient) {
        const ingredient = ingredientsStore
          .ingredients()
          .find((candidate) => candidate.id === ingredientId);

        const currentStock = ingredient?.currentStock ?? 0;
        if (currentStock >= required.required) continue;

        const missing = required.required - currentStock;
        const ingredientName = ingredient?.name ?? required.ingredientName;
        const unit = ingredient?.unit ?? '';
        shortages.push(`${ingredientName} (faltan ${missing.toFixed(2)} ${unit})`);
      }

      if (shortages.length > 0) {
        throw new Error(`Stock insuficiente para registrar la venta: ${shortages.join(', ')}`);
      }
    };

    const throwIfInsufficientForEdition = (
      oldItems: { recipeId: string; quantity: number }[],
      newItems: { recipeId: string; quantity: number }[],
    ): void => {
      const oldRequired = getRequiredIngredients(oldItems);
      const newRequired = getRequiredIngredients(newItems);
      const ingredientIds = new Set([...oldRequired.keys(), ...newRequired.keys()]);
      const shortages: string[] = [];

      for (const ingredientId of ingredientIds) {
        const previous = oldRequired.get(ingredientId)?.required ?? 0;
        const next = newRequired.get(ingredientId)?.required ?? 0;
        const extraNeeded = next - previous;

        if (extraNeeded <= 0) continue;

        const ingredient = ingredientsStore
          .ingredients()
          .find((candidate) => candidate.id === ingredientId);

        const currentStock = ingredient?.currentStock ?? 0;
        if (currentStock >= extraNeeded) continue;

        const missing = extraNeeded - currentStock;
        const ingredientName =
          ingredient?.name ??
          newRequired.get(ingredientId)?.ingredientName ??
          oldRequired.get(ingredientId)?.ingredientName ??
          ingredientId;
        const unit = ingredient?.unit ?? '';
        shortages.push(`${ingredientName} (faltan ${missing.toFixed(2)} ${unit})`);
      }

      if (shortages.length > 0) {
        throw new Error(`Stock insuficiente para modificar la venta: ${shortages.join(', ')}`);
      }
    };

    return {
      async registerSale(sale: SaleInput) {
        patchState(store, { loading: true, error: null });
        try {
          throwIfInsufficientForCreation(sale.items);

          const saleId = await fs.addDocument<SaleInput>('sales', sale);

          const adjustments = buildStockAdjustments(sale.items, -1);
          await fs.applyStockAdjustments(saleId, 'sale_deduction', adjustments);

          patchState(store, { loading: false });
          return saleId;
        } catch (error: unknown) {
          return handleStoreError(error);
        }
      },

      async updateSale(id: string, updatedSale: SaleInput) {
        patchState(store, { loading: true, error: null });
        try {
          const oldSale = store.sales().find((candidate) => candidate.id === id);
          
          // If items changed, adjust stock
          if (oldSale && JSON.stringify(oldSale.items) !== JSON.stringify(updatedSale.items)) {
            throwIfInsufficientForEdition(oldSale.items, updatedSale.items);

            // Restock the old items
            const oldAdjustments = buildStockAdjustments(oldSale.items, 1);
            await fs.applyStockAdjustments(id, 'edit_restock', oldAdjustments);
            
            // Destock the new items
            const newAdjustments = buildStockAdjustments(updatedSale.items, -1);
            await fs.applyStockAdjustments(id, 'edit_deduction', newAdjustments);
          }

          await fs.updateDocument('sales', id, {
            items: updatedSale.items,
            total: updatedSale.total,
            totalCost: updatedSale.totalCost,
            profit: updatedSale.profit,
            deliveryDate: updatedSale.deliveryDate ?? null,
            customerId: updatedSale.customerId,
            customerName: updatedSale.customerName,
            isPaid: updatedSale.isPaid ?? false,
            paymentMethod: updatedSale.paymentMethod,
            notes: updatedSale.notes,
          });

          patchState(store, { loading: false });
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
