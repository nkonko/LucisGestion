import { Timestamp } from 'firebase/firestore';

export interface Cliente {
  id?: string;
  nombre: string;
  telefono: string;
  direccion: string;
  notas: string;
  totalCompras: number;
  ultimaCompra: Timestamp | null;
}

export type ClienteInput = Omit<Cliente, 'id'>;
