export type IngredientCategory =
  | 'dry'
  | 'dairy'
  | 'eggs'
  | 'fats'
  | 'sugars'
  | 'decoration'
  | 'other';

export const INGREDIENT_CATEGORY_DISPLAY: Record<IngredientCategory, string> = {
  dry: 'Secos',
  dairy: 'Lácteos',
  eggs: 'Huevos',
  fats: 'Grasas',
  sugars: 'Azúcares',
  decoration: 'Decoración',
  other: 'Otros',
};
