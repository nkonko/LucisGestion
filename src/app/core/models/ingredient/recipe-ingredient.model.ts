import type { MeasurementUnit } from './measurement-unit.model';

export interface RecipeIngredient {
  ingredientId: string;
  name: string;
  quantity: number;
  unit: MeasurementUnit;
  lineCost: number;
}
