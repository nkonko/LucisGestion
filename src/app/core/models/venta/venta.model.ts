import { Timestamp } from 'firebase/firestore';
import type { EstadoVenta } from './estado-venta.model';
import type { VentaItem } from './venta-item.model';
import { MedioPago } from './medio-pago.model';

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

export type VentaInput = Omit<Venta, 'id'>;
