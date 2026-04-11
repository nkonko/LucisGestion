import { Timestamp } from 'firebase/firestore';
import { GastoItem } from './ingrediente.model';

export interface GastoInsumo {
  id?: string;
  fecha: Timestamp;
  descripcion: string;
  items: GastoItem[];
  total: number;
  proveedor: string;
}

export type GastoInsumoInput = Omit<GastoInsumo, 'id'>;
