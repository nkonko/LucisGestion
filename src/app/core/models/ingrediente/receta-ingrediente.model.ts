import type { UnidadMedida } from './unidad-medida.model';

export interface RecetaIngrediente {
  ingredienteId: string;
  nombre: string;
  cantidad: number;
  unidad: UnidadMedida;
  costoLinea: number;
}
