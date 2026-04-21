import { Timestamp } from 'firebase/firestore';
import type { UnidadMedida } from './unidad-medida.model';
import type { CategoriaIngrediente } from './categoria-ingrediente.model';

export interface Ingrediente {
  id?: string;
  nombre: string;
  unidad: UnidadMedida;
  precioUnitario: number;
  stockActual: number;
  stockMinimo: number;
  categoria: CategoriaIngrediente;
  ultimaCompra: Timestamp | null;
  activo: boolean;
}

export type IngredienteInput = Omit<Ingrediente, 'id'>;
export type IngredienteInputForm = Omit<Ingrediente, 'id' | 'ultimaCompra' | 'activo'>;
