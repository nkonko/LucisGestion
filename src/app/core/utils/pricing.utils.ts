import { Ingredient, RecipeIngredient } from '../models/ingredient';

export function calculateRecipeCost(
  recipeIngredients: RecipeIngredient[],
  currentIngredients: Ingredient[],
): number {
  let totalCost = 0;
  for (const recipeIngredient of recipeIngredients) {
    const currentIngredient = currentIngredients.find(
      (ingredient) => ingredient.id === recipeIngredient.ingredientId,
    );
    if (currentIngredient) {
      totalCost += recipeIngredient.quantity * currentIngredient.unitPrice;
    }
  }
  return Math.round(totalCost * 100) / 100;
}

export function calculateSuggestedPrice(cost: number, marginPercentage: number): number {
  return Math.ceil(cost * (1 + marginPercentage / 100));
}
