import { Injectable, inject } from '@angular/core';
import { StockAdjustmentInput } from '../models/stock';
import { RequiredIngredient } from '../models/sale/required-ingredient';
import { IngredientsStore } from '../store/ingredients.store';
import { RecipesStore } from '../store/recipes.store';

@Injectable({ providedIn: 'root' })
export class StockService {
  private ingredientsStore = inject(IngredientsStore);
  private recipesStore = inject(RecipesStore);

  buildStockAdjustments(
    items: { recipeId: string; quantity: number }[],
    factor: -1 | 1,
  ): StockAdjustmentInput[] {
    const adjustmentsByIngredient = new Map<string, StockAdjustmentInput>();

    for (const item of items) {
      const recipe = this.recipesStore.recipes().find((candidate) => candidate.id === item.recipeId);
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
          this.ingredientsStore.ingredients().find((ingredient) => ingredient.id === recipeIngredient.ingredientId)?.name ?? recipeIngredient.name;

        adjustmentsByIngredient.set(recipeIngredient.ingredientId, {
          ingredientId: recipeIngredient.ingredientId,
          ingredientName,
          delta,
        });
      }
    }

    return [...adjustmentsByIngredient.values()];
  }

  private getRequiredIngredients(
    items: { recipeId: string; quantity: number }[],
  ): Map<string, RequiredIngredient> {
    const requiredByIngredient = new Map<string, RequiredIngredient>();

    for (const item of items) {
      const recipe = this.recipesStore.recipes().find((candidate) => candidate.id === item.recipeId);
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
  }

  validateStockForCreation(items: { recipeId: string; quantity: number }[]): void {
    const requiredByIngredient = this.getRequiredIngredients(items);
    const shortages: string[] = [];

    for (const [ingredientId, required] of requiredByIngredient) {
      const ingredient = this.ingredientsStore
        .ingredients()
        .find((candidate) => candidate.id === ingredientId);

      const currentStock = ingredient?.currentStock;
      if (currentStock == null) continue;

      if (currentStock >= required.required) continue;

      const missing = required.required - currentStock;
      const ingredientName = ingredient?.name ?? required.ingredientName;
      const unit = ingredient?.unit ?? '';
      shortages.push(`${ingredientName} (faltan ${missing.toFixed(2)} ${unit})`);
    }

    if (shortages.length > 0) {
      throw new Error(`Stock insuficiente para registrar la venta: ${shortages.join(', ')}`);
    }
  }

  validateStockForEdition(
    oldItems: { recipeId: string; quantity: number }[],
    newItems: { recipeId: string; quantity: number }[],
  ): void {
    const oldRequired = this.getRequiredIngredients(oldItems);
    const newRequired = this.getRequiredIngredients(newItems);
    const ingredientIds = new Set([...oldRequired.keys(), ...newRequired.keys()]);
    const shortages: string[] = [];

    for (const ingredientId of ingredientIds) {
      const previous = oldRequired.get(ingredientId)?.required ?? 0;
      const next = newRequired.get(ingredientId)?.required ?? 0;
      const extraNeeded = next - previous;

      if (extraNeeded <= 0) continue;

      const ingredient = this.ingredientsStore
        .ingredients()
        .find((candidate) => candidate.id === ingredientId);

      const currentStock = ingredient?.currentStock;
      if (currentStock == null) continue;

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
  }
}
