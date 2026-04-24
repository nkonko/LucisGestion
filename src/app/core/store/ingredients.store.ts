import { computed, inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { FirestoreService } from '../services/firestore.service';
import {
  Ingredient,
  PriceHistory,
  IngredientInput,
  StockMovementInput,
} from '../models/ingredient';
import { SupplyExpenseInput } from '../models/supply-expense';
import { where, orderBy, Timestamp } from '@angular/fire/firestore';
import { toSignal } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import { BaseState } from './state/state';
import { getStockPriority } from '../utils/stock.utils';

export const IngredientsStore = signalStore(
  { providedIn: 'root' },
  withState<BaseState>({ loading: false, error: null }),

  withMethods((store) => {
    const fs = inject(FirestoreService);

    const ingredients$ = fs.getCollection<Ingredient>(
      'ingredientes',
      where('active', '==', true),
      orderBy('name', 'asc'),
    );
    const ingredients = toSignal(ingredients$, { initialValue: [] as Ingredient[] });

    const lowStock = computed(() => ingredients().filter((i) => i.currentStock <= i.minimumStock));

    return {
      ingredients,
      lowStock,
      lowStockCount: computed(() => lowStock().length),
      ingredientsSortedByStock: computed(() =>
        [...ingredients()].sort((a, b) => getStockPriority(a) - getStockPriority(b)),
      ),

      async createIngredient(ingredient: IngredientInput) {
        patchState(store, { loading: true, error: null });
        try {
          const id = await fs.addDocument('ingredientes', {
            ...ingredient,
            active: true,
          } as IngredientInput);
          patchState(store, { loading: false });
          return id;
        } catch (e: any) {
          patchState(store, { loading: false, error: e.message });
          throw e;
        }
      },

      async updateIngredient(id: string, changes: Partial<Ingredient>) {
        patchState(store, { loading: true, error: null });
        try {
          await fs.updateDocument('ingredientes', id, changes as Record<string, any>);

          // Record price history if price changed
          if (changes.unitPrice !== undefined) {
            const current = ingredients().find((i) => i.id === id);
            if (current && current.unitPrice !== changes.unitPrice) {
              await fs.addDocument('historialPrecios', {
                ingredientId: id,
                ingredientName: current.name,
                previousPrice: current.unitPrice,
                newPrice: changes.unitPrice,
                date: Timestamp.now(),
              } as PriceHistory);
            }

            await fs.updateDocument('ingredientes', id, {
              lastPurchase: Timestamp.now(),
            });
          }

          patchState(store, { loading: false });
        } catch (e: any) {
          patchState(store, { loading: false, error: e.message });
          throw e;
        }
      },

      async deleteIngredient(id: string) {
        try {
          return await fs.softDelete('ingredientes', id);
        } catch (e: any) {
          patchState(store, { error: e.message });
          throw e;
        }
      },

      async registerSupplyPurchase(expense: SupplyExpenseInput) {
        patchState(store, { loading: true, error: null });
        try {
          const expenseId = await fs.addDocument('gastosInsumos', expense as SupplyExpenseInput);

          for (const item of expense.items) {
            const ingredient = ingredients().find((i) => i.id === item.ingredientId);
            if (!ingredient) continue;

            const newStock = ingredient.currentStock + item.quantity;
            await fs.updateDocument('ingredientes', item.ingredientId, {
              currentStock: newStock,
              unitPrice: item.unitPrice,
              lastPurchase: Timestamp.now(),
            });

            await fs.addDocument<StockMovementInput>('movimientosStock', {
              ingredientId: item.ingredientId,
              ingredientName: ingredient.name,
              type: 'purchase',
              quantity: item.quantity,
              date: Timestamp.now(),
              saleId: null,
            });
          }

          patchState(store, { loading: false });
          return expenseId;
        } catch (e: any) {
          patchState(store, { loading: false, error: e.message });
          throw e;
        }
      },

      getPriceHistory(ingredientId: string): Observable<PriceHistory[]> {
        return fs.getCollection<PriceHistory>(
          'historialPrecios',
          where('ingredientId', '==', ingredientId),
          orderBy('date', 'desc'),
        );
      },
    };
  }),
);
