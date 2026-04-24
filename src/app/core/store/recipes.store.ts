import { computed, inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { FirestoreService } from '../services/firestore.service';
import { Recipe, RecipeInput } from '../models/recipe';
import { where, orderBy } from '@angular/fire/firestore';
import { toSignal } from '@angular/core/rxjs-interop';
import { IngredientsStore } from './ingredients.store';
import { calculateRecipeCost, calculateSuggestedPrice } from '../utils/pricing.utils';
import { BaseState } from './state/state';

export const RecipesStore = signalStore(
  { providedIn: 'root' },
  withState<BaseState>({ loading: false, error: null }),

  withMethods((store) => {
    const fs = inject(FirestoreService);
    const ingredientsStore = inject(IngredientsStore);

    const recipes$ = fs.getCollection<Recipe>(
      'recetas',
      where('active', '==', true),
      orderBy('name', 'asc'),
    );
    const recipes = toSignal(recipes$, { initialValue: [] as Recipe[] });

    return {
      recipes,
      totalRecipes: computed(() => recipes().length),

      async createRecipe(recipe: RecipeInput) {
        patchState(store, { loading: true, error: null });
        try {
          const calculatedCost = calculateRecipeCost(
            recipe.ingredients,
            ingredientsStore.ingredients(),
          );
          const suggestedPrice = calculateSuggestedPrice(calculatedCost, recipe.profitMargin);

          const id = await fs.addDocument('recetas', {
            ...recipe,
            calculatedCost,
            suggestedPrice,
            salePrice: recipe.salePrice || suggestedPrice,
            active: true,
          } as RecipeInput);
          patchState(store, { loading: false });
          return id;
        } catch (e: any) {
          patchState(store, { loading: false, error: e.message });
          throw e;
        }
      },

      async updateRecipe(id: string, changes: Partial<Recipe>) {
        patchState(store, { loading: true, error: null });
        try {
          if (changes.ingredients || changes.profitMargin !== undefined) {
            const current = recipes().find((r) => r.id === id);
            const ings = changes.ingredients ?? current?.ingredients ?? [];
            const margin = changes.profitMargin ?? current?.profitMargin ?? 0;

            changes.calculatedCost = calculateRecipeCost(ings, ingredientsStore.ingredients());
            changes.suggestedPrice = calculateSuggestedPrice(changes.calculatedCost, margin);
          }
          await fs.updateDocument('recetas', id, changes as Record<string, any>);
          patchState(store, { loading: false });
        } catch (e: any) {
          patchState(store, { loading: false, error: e.message });
          throw e;
        }
      },

      async duplicateRecipe(recipe: Recipe) {
        try {
          const { id, ...data } = recipe;
          return await fs.addDocument('recetas', {
            ...data,
            name: `${data.name} (copia)`,
            active: true,
          } as RecipeInput);
        } catch (e: any) {
          patchState(store, { error: e.message });
          throw e;
        }
      },

      async deleteRecipe(id: string) {
        try {
          return await fs.softDelete('recetas', id);
        } catch (e: any) {
          patchState(store, { error: e.message });
          throw e;
        }
      },

      /** Recalculates costs for all recipes using a given ingredient */
      async recalculateForIngredientChange(ingredientId: string) {
        const affected = recipes().filter((r) =>
          r.ingredients.some((i) => i.ingredientId === ingredientId),
        );
        for (const recipe of affected) {
          const calculatedCost = calculateRecipeCost(
            recipe.ingredients,
            ingredientsStore.ingredients(),
          );
          const suggestedPrice = calculateSuggestedPrice(calculatedCost, recipe.profitMargin);
          await fs.updateDocument('recetas', recipe.id!, { calculatedCost, suggestedPrice });
        }
      },
    };
  }),
);
