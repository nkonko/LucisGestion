export type CategoriaReceta = 'tortas' | 'tartas' | 'galletas' | 'postres' | 'panes' | 'otros';

export const CATEGORIAS_RECETA_DISPLAY: Record<CategoriaReceta, string> = {
  tortas: 'Tortas',
  tartas: 'Tartas',
  galletas: 'Galletas',
  postres: 'Postres',
  panes: 'Panes',
  otros: 'Otros',
};
