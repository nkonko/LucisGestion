import type { RecipeIngredient } from '../ingredient/recipe-ingredient.model';
import type { RecipeCategory } from './recipe-category.model';

export interface Recipe {
  id?: string;
  name: string;
  category: RecipeCategory;
  ingredients: RecipeIngredient[];
  calculatedCost: number;
  profitMargin: number;
  suggestedPrice: number;
  salePrice: number;
  yield: number;
  notes: string;
  imageUrl: string;
  active: boolean;
}

export type RecipeInput = Omit<Recipe, 'id'>;
