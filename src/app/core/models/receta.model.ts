import { RecetaIngrediente } from './ingrediente.model';

export interface Receta {
  id?: string;
  nombre: string;
  categoria: CategoriaReceta;
  ingredientes: RecetaIngrediente[];
  costoCalculado: number;
  margenGanancia: number; // percentage, e.g. 60
  precioSugerido: number; // costoCalculado * (1 + margen/100)
  precioVenta: number; // manual override allowed
  rendimiento: number;
  notas: string;
  imagenUrl: string;
  activo: boolean;
}

export type CategoriaReceta = 'tortas' | 'tartas' | 'galletas' | 'postres' | 'panes' | 'otros';

export const CATEGORIAS_RECETA_DISPLAY: Record<CategoriaReceta, string> = {
  tortas: 'Tortas',
  tartas: 'Tartas',
  galletas: 'Galletas',
  postres: 'Postres',
  panes: 'Panes',
  otros: 'Otros',
};

export type RecetaInput = Omit<Receta, 'id'>;
