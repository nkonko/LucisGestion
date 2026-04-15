import type { RecetaIngrediente } from '../ingrediente/receta-ingrediente.model';
import type { CategoriaReceta } from './categoria-receta.model';

export interface Receta {
  id?: string;
  nombre: string;
  categoria: CategoriaReceta;
  ingredientes: RecetaIngrediente[];
  costoCalculado: number;
  margenGanancia: number;
  precioSugerido: number;
  precioVenta: number;
  rendimiento: number;
  notas: string;
  imagenUrl: string;
  activo: boolean;
}

export type RecetaInput = Omit<Receta, 'id'>;
