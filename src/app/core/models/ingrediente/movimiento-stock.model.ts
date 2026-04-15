import { Timestamp } from 'firebase/firestore';
import type { TipoMovimiento } from './tipo-movimiento.model';

export interface MovimientoStock {
  id?: string;
  ingredienteId: string;
  ingredienteNombre: string;
  tipo: TipoMovimiento;
  cantidad: number;
  fecha: Timestamp;
  ventaId: string | null;
}

export type MovimientoStockInput = Omit<MovimientoStock, 'id'>;
