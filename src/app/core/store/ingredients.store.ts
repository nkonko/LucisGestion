import { computed, inject } from '@angular/core';
import { signalStore, withState, withComputed, withMethods, patchState } from '@ngrx/signals';
import * as Sentry from '@sentry/angular';
import { FirestoreService } from '../services/firestore.service';
import {
  Ingredient,
  PriceHistory,
  IngredientInput,
} from '../models/ingredient';
import { SupplyExpense, SupplyExpenseInput } from '../models/supply-expense';
import { where, orderBy, Timestamp } from '@angular/fire/firestore';
import { toSignal } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import { BaseState } from './state/state';
import { getStockPriority } from '../utils/stock.utils';
import { getErrorMessage } from '../utils/error.utils';

export const IngredientsStore = signalStore(
  { providedIn: 'root' },
  withState<BaseState>({ loading: false, error: null }),

  withComputed(() => {
    const fs = inject(FirestoreService);

    const ingredients$ = fs.getCollection<Ingredient>(
      'ingredients',
      where('active', '==', true),
      orderBy('name', 'asc'),
    );
    const ingredients = toSignal(ingredients$, { initialValue: [] as Ingredient[] });
    const supplyExpenses$ = fs.getCollection<SupplyExpense>('supplyExpenses', orderBy('date', 'desc'));
    const supplyExpenses = toSignal(supplyExpenses$, { initialValue: [] as SupplyExpense[] });

    const lowStock = computed(() =>
      ingredients().filter((ingredient) => ingredient.currentStock <= ingredient.minimumStock),
    );

    return {
      ingredients,
      supplyExpenses,
      lowStock,
      lowStockCount: computed(() => lowStock().length),
      ingredientsSortedByStock: computed(() =>
        [...ingredients()].sort((a, b) => getStockPriority(a) - getStockPriority(b)),
      ),
    };
  }),

  withMethods((store) => {
    const fs = inject(FirestoreService);

    return {
      async createIngredient(ingredient: IngredientInput) {
        patchState(store, { loading: true, error: null });
        try {
          const id = await fs.addDocument('ingredients', {
            ...ingredient,
            active: true,
          } as IngredientInput);
          patchState(store, { loading: false });
          return id;
        } catch (error: unknown) {
          Sentry.captureException(error, {
            tags: { area: 'store', store: 'IngredientsStore', operation: 'createIngredient' },
          });
          patchState(store, { loading: false, error: getErrorMessage(error) });
          throw error;
        }
      },

      async updateIngredient(id: string, changes: Partial<Ingredient>) {
        patchState(store, { loading: true, error: null });
        try {
          await fs.updateDocument('ingredients', id, changes as Record<string, unknown>);

          if (changes.unitPrice !== undefined) {
            const current = store.ingredients().find((ingredient) => ingredient.id === id);
            if (current && current.unitPrice !== changes.unitPrice) {
              await fs.addDocument('priceHistory', {
                ingredientId: id,
                ingredientName: current.name,
                previousPrice: current.unitPrice,
                newPrice: changes.unitPrice,
                date: Timestamp.now(),
              } as PriceHistory);
            }

            await fs.updateDocument('ingredients', id, {
              lastPurchase: Timestamp.now(),
            });
          }

          patchState(store, { loading: false });
        } catch (error: unknown) {
          Sentry.captureException(error, {
            tags: { area: 'store', store: 'IngredientsStore', operation: 'updateIngredient' },
          });
          patchState(store, { loading: false, error: getErrorMessage(error) });
          throw error;
        }
      },

      async deleteIngredient(id: string) {
        try {
          return await fs.softDelete('ingredients', id);
        } catch (error: unknown) {
          Sentry.captureException(error, {
            tags: { area: 'store', store: 'IngredientsStore', operation: 'deleteIngredient' },
          });
          patchState(store, { error: getErrorMessage(error) });
          throw error;
        }
      },

      async registerSupplyPurchase(expense: SupplyExpenseInput) {
        patchState(store, { loading: true, error: null });
        try {
          const expenseId = fs.createDocumentId('supplyExpenses');
          const purchaseDate = expense.date ?? Timestamp.now();

          const purchaseItems = expense.items
            .map((item) => {
              const ingredient = store.ingredients().find((candidate) => candidate.id === item.ingredientId);
              if (!ingredient) {
                return null;
              }

              return {
                ingredientId: item.ingredientId,
                ingredientName: ingredient.name,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
              };
            })
            .filter((item): item is NonNullable<typeof item> => item !== null);

          await fs.registerSupplyPurchaseAtomic({
            expenseId,
            date: purchaseDate,
            description: expense.description,
            supplier: expense.supplier,
            total: expense.total,
            items: purchaseItems,
          });

          patchState(store, { loading: false });
          return expenseId;
        } catch (error: unknown) {
          Sentry.captureException(error, {
            tags: { area: 'store', store: 'IngredientsStore', operation: 'registerSupplyPurchase' },
          });
          patchState(store, { loading: false, error: getErrorMessage(error) });
          throw error;
        }
      },

      getPriceHistory(ingredientId: string): Observable<PriceHistory[]> {
        return fs.getCollection<PriceHistory>(
          'priceHistory',
          where('ingredientId', '==', ingredientId),
          orderBy('date', 'desc'),
        );
      },
    };
  }),
);
