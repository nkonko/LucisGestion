import { Timestamp } from 'firebase/firestore';

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

export type MedioPago = 'efectivo' | 'transferencia' | 'mercadopago';
export type EstadoVenta = 'pendiente' | 'entregado' | 'cancelado';

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

export type VentaInput = Omit<Venta, 'id'>;
