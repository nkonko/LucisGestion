import { Timestamp } from 'firebase/firestore';
import { CategoriaIngrediente } from './categoria-ingrediente.model';
import { UnidadMedida } from './unidad-medida.model';

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
