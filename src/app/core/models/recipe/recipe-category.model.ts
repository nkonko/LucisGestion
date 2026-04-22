export type RecipeCategory = 'cakes' | 'pies' | 'cookies' | 'desserts' | 'breads' | 'other';

export const RECIPE_CATEGORY_DISPLAY: Record<RecipeCategory, string> = {
  cakes: 'Tortas',
  pies: 'Tartas',
  cookies: 'Galletas',
  desserts: 'Postres',
  breads: 'Panes',
  other: 'Otros',
};
