import { Timestamp } from 'firebase/firestore';

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

export interface RecetaIngrediente {
  ingredienteId: string;
  nombre: string; // denormalized for display
  cantidad: number;
  unidad: UnidadMedida;
  costoLinea: number; // cantidad * precioUnitario
}

export interface MovimientoStock {
  id?: string;
  ingredienteId: string;
  ingredienteNombre: string;
  tipo: TipoMovimiento;
  cantidad: number;
  fecha: Timestamp;
  ventaId: string | null;
}

export interface GastoItem {
  ingredienteId: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  precioTotal: number;
}

export interface HistorialPrecio {
  id?: string;
  ingredienteId: string;
  ingredienteNombre: string;
  precioAnterior: number;
  precioNuevo: number;
  fecha: Timestamp;
}

// Enums as union types
export type UnidadMedida = 'kg' | 'g' | 'lt' | 'ml' | 'unidad' | 'docena';
export type CategoriaIngrediente =
  | 'secos'
  | 'lacteos'
  | 'huevos'
  | 'grasas'
  | 'azucares'
  | 'decoracion'
  | 'otros';
export type TipoMovimiento = 'compra' | 'venta_deduccion' | 'ajuste' | 'cancelacion_reposicion';

// Input types
export type IngredienteInput = Omit<Ingrediente, 'id'>;
export type MovimientoStockInput = Omit<MovimientoStock, 'id'>;

// Display labels
export const UNIDADES_DISPLAY: Record<UnidadMedida, string> = {
  kg: 'Kilogramo',
  g: 'Gramo',
  lt: 'Litro',
  ml: 'Mililitro',
  unidad: 'Unidad',
  docena: 'Docena',
};

export const CATEGORIAS_INGREDIENTE_DISPLAY: Record<CategoriaIngrediente, string> = {
  secos: 'Secos',
  lacteos: 'Lácteos',
  huevos: 'Huevos',
  grasas: 'Grasas',
  azucares: 'Azúcares',
  decoracion: 'Decoración',
  otros: 'Otros',
};
