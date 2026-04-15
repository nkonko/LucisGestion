import { Timestamp } from 'firebase/firestore';

export interface HistorialPrecio {
  id?: string;
  ingredienteId: string;
  ingredienteNombre: string;
  precioAnterior: number;
  precioNuevo: number;
  fecha: Timestamp;
}
