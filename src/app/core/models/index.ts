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

export interface Receta {
  id?: string;
  nombre: string;
  categoria: CategoriaReceta;
  ingredientes: RecetaIngrediente[];
  costoCalculado: number;
  margenGanancia: number; // percentage, e.g. 60
  precioSugerido: number; // costoCalculado * (1 + margen/100)
  precioVenta: number;    // manual override allowed
  rendimiento: number;
  notas: string;
  imagenUrl: string;
  activo: boolean;
}

export interface VentaItem {
  recetaId: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  costoUnitario: number;
}

export interface Venta {
  id?: string;
  fecha: Timestamp;
  clienteId: string | null;
  clienteNombre: string;
  items: VentaItem[];
  total: number;
  costoTotal: number;
  ganancia: number;
  medioPago: MedioPago;
  estado: EstadoVenta;
  notas: string;
}

export interface Cliente {
  id?: string;
  nombre: string;
  telefono: string;
  direccion: string;
  notas: string;
  totalCompras: number;
  ultimaCompra: Timestamp | null;
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

export interface GastoInsumo {
  id?: string;
  fecha: Timestamp;
  descripcion: string;
  items: GastoItem[];
  total: number;
  proveedor: string;
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
export type CategoriaIngrediente = 'secos' | 'lacteos' | 'huevos' | 'grasas' | 'azucares' | 'decoracion' | 'otros';
export type CategoriaReceta = 'tortas' | 'tartas' | 'galletas' | 'postres' | 'panes' | 'otros';
export type MedioPago = 'efectivo' | 'transferencia' | 'mercadopago';
export type EstadoVenta = 'pendiente' | 'entregado' | 'cancelado';
export type TipoMovimiento = 'compra' | 'venta_deduccion' | 'ajuste' | 'cancelacion_reposicion';

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

export const CATEGORIAS_RECETA_DISPLAY: Record<CategoriaReceta, string> = {
  tortas: 'Tortas',
  tartas: 'Tartas',
  galletas: 'Galletas',
  postres: 'Postres',
  panes: 'Panes',
  otros: 'Otros',
};

export const MEDIOS_PAGO_DISPLAY: Record<MedioPago, string> = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  mercadopago: 'MercadoPago',
};

export const ESTADOS_VENTA_DISPLAY: Record<EstadoVenta, string> = {
  pendiente: 'Pendiente',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
};

// --- Costos Fijos ---

export interface CostoFijo {
  id?: string;
  nombre: string;
  descripcion: string;
  monto: number;
  frecuencia: FrecuenciaCosto;
  categoria: CategoriaCosto;
  activo: boolean;
}

export type FrecuenciaCosto = 'mensual' | 'semanal';
export type CategoriaCosto = 'servicios' | 'alquiler' | 'sueldos' | 'impuestos' | 'otros';

export const FRECUENCIA_DISPLAY: Record<FrecuenciaCosto, string> = {
  mensual: 'Mensual',
  semanal: 'Semanal',
};

export const CATEGORIA_COSTO_DISPLAY: Record<CategoriaCosto, string> = {
  servicios: 'Servicios (luz, gas, agua)',
  alquiler: 'Alquiler',
  sueldos: 'Sueldos',
  impuestos: 'Impuestos / Monotributo',
  otros: 'Otros',
};
