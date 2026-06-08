export type IngredientIcon = string;

export interface IngredientIconOption {
  value: IngredientIcon;
  label: string;
  tone: 'grain' | 'sweet' | 'dairy' | 'fresh' | 'pantry';
}

export const DEFAULT_INGREDIENT_ICON: IngredientIcon = '📦';

export const INGREDIENT_ICON_OPTIONS: IngredientIconOption[] = [
  { value: '🌾', label: 'Harina', tone: 'grain' },
  { value: '🍬', label: 'Azúcar', tone: 'sweet' },
  { value: '🧈', label: 'Manteca', tone: 'dairy' },
  { value: '🥚', label: 'Huevos', tone: 'dairy' },
  { value: '🍫', label: 'Chocolate', tone: 'sweet' },
  { value: '🍪', label: 'Galletas', tone: 'sweet' },
  { value: '🥛', label: 'Leche', tone: 'dairy' },
  { value: '🌿', label: 'Hierbas', tone: 'fresh' },
  { value: '🍓', label: 'Frutilla', tone: 'fresh' },
  { value: '🌰', label: 'Castaña', tone: 'pantry' },
  { value: '🍯', label: 'Miel', tone: 'pantry' },
  { value: '🍋', label: 'Limón', tone: 'fresh' },
  { value: '🧂', label: 'Sal', tone: 'pantry' },
  { value: '☕', label: 'Café', tone: 'pantry' },
  { value: '🍎', label: 'Manzana', tone: 'fresh' },
  { value: '🥥', label: 'Coco', tone: 'fresh' },
];
