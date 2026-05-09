import { computed, inject } from '@angular/core';
import { signalStore, withState, withComputed, withMethods, patchState } from '@ngrx/signals';
import { FirestoreService } from '../services/firestore.service';
import { Recipe, RecipeInput } from '../models/recipe';
import { where, orderBy } from '@angular/fire/firestore';
import { toSignal } from '@angular/core/rxjs-interop';
import { IngredientsStore } from './ingredients.store';
import { calculateRecipeCost, calculateSuggestedPrice } from '../utils/pricing.utils';
import { BaseState } from './state/state';
import { getErrorMessage } from '../utils/error.utils';

export const RecipesStore = signalStore(
  { providedIn: 'root' },
  withState<BaseState>({ loading: false, error: null }),

  withComputed(() => {
    const fs = inject(FirestoreService);
    const ingredientsStore = inject(IngredientsStore);

    const recipes$ = fs.getCollection<Recipe>(
      'recipes',
      where('active', '==', true),
      orderBy('name', 'asc'),
    );
    const rawRecipes = toSignal(recipes$, { initialValue: [] as Recipe[] });

    const recipes = computed(() => {
      const ingredients = ingredientsStore.ingredients();
      return rawRecipes().map((recipe) => {
        const calculatedCost = calculateRecipeCost(recipe.ingredients, ingredients);
        const suggestedPrice = calculateSuggestedPrice(calculatedCost, recipe.profitMargin);
        return { ...recipe, calculatedCost, suggestedPrice };
      });
    });

    return {
      recipes,
      totalRecipes: computed(() => recipes().length),
    };
  }),

  withMethods((store) => {
    const fs = inject(FirestoreService);
    const ingredientsStore = inject(IngredientsStore);

    return {
      async createRecipe(recipe: RecipeInput) {
        patchState(store, { loading: true, error: null });
        try {
          const calculatedCost = calculateRecipeCost(
            recipe.ingredients,
            ingredientsStore.ingredients(),
          );
          const suggestedPrice = calculateSuggestedPrice(calculatedCost, recipe.profitMargin);

          const id = await fs.addDocument('recipes', {
            ...recipe,
            calculatedCost,
            suggestedPrice,
            salePrice: recipe.salePrice || suggestedPrice,
            active: true,
          } as RecipeInput);
          patchState(store, { loading: false });
          return id;
        } catch (error: unknown) {
          patchState(store, { loading: false, error: getErrorMessage(error) });
          throw error;
        }
      },

      async updateRecipe(id: string, changes: Partial<Recipe>) {
        patchState(store, { loading: true, error: null });
        try {
          let nextChanges: Partial<Recipe> = changes;
          if (changes.ingredients || changes.profitMargin !== undefined) {
            const current = store.recipes().find((recipe) => recipe.id === id);
            const ingredients = changes.ingredients ?? current?.ingredients ?? [];
            const margin = changes.profitMargin ?? current?.profitMargin ?? 0;

            const calculatedCost = calculateRecipeCost(ingredients, ingredientsStore.ingredients());
            const suggestedPrice = calculateSuggestedPrice(calculatedCost, margin);
            nextChanges = { ...changes, calculatedCost, suggestedPrice };
          }
          await fs.updateDocument('recipes', id, nextChanges as Record<string, unknown>);
          patchState(store, { loading: false });
        } catch (error: unknown) {
          patchState(store, { loading: false, error: getErrorMessage(error) });
          throw error;
        }
      },

      async duplicateRecipe(recipe: Recipe) {
        try {
          const { id, ...data } = recipe;
          return await fs.addDocument('recipes', {
            ...data,
            name: `${data.name} (copia)`,
            active: true,
          } as RecipeInput);
        } catch (error: unknown) {
          patchState(store, { error: getErrorMessage(error) });
          throw error;
        }
      },

      async deleteRecipe(id: string) {
        try {
          return await fs.softDelete('recipes', id);
        } catch (error: unknown) {
          patchState(store, { error: getErrorMessage(error) });
          throw error;
        }
      },
    };
  }),
);
