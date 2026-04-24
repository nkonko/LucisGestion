import { Timestamp } from 'firebase/firestore';
import type { MeasurementUnit } from './measurement-unit.model';
import type { IngredientCategory } from './ingredient-category.model';

export interface Ingredient {
  id?: string;
  name: string;
  unit: MeasurementUnit;
  unitPrice: number;
  currentStock: number;
  minimumStock: number;
  category: IngredientCategory;
  lastPurchase: Timestamp | null;
  active: boolean;
}

export type IngredientInput = Omit<Ingredient, 'id'>;
export type IngredientInputForm = Omit<Ingredient, 'id' | 'lastPurchase' | 'active'>;
