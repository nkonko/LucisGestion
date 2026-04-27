import type { Ingredient } from '../models/ingredient';

export function getStockPriority(ingredient: Ingredient): number {
  if (ingredient.currentStock <= 0) {
    return 0;
  }

  if (ingredient.currentStock <= ingredient.minimumStock) {
    return 1;
  }

  return 2;
}
