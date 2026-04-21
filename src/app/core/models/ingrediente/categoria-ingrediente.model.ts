export type CategoriaIngrediente =
  | 'secos'
  | 'lacteos'
  | 'huevos'
  | 'grasas'
  | 'azucares'
  | 'decoracion'
  | 'otros';

export const CATEGORIAS_INGREDIENTE_DISPLAY: Record<CategoriaIngrediente, string> = {
  secos: 'Secos',
  lacteos: 'Lácteos',
  huevos: 'Huevos',
  grasas: 'Grasas',
  azucares: 'Azúcares',
  decoracion: 'Decoración',
  otros: 'Otros',
};
