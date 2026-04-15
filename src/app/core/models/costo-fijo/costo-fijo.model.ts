import type { FrecuenciaCosto } from './frecuencia-costo.model';
import type { CategoriaCosto } from './categoria-costo.model';

export interface CostoFijo {
  id?: string;
  nombre: string;
  descripcion: string;
  monto: number;
  frecuencia: FrecuenciaCosto;
  categoria: CategoriaCosto;
  activo: boolean;
}

export type CostoFijoInput = Omit<CostoFijo, 'id'>;
export type CostoFijoInputForm = Omit<CostoFijo, 'id' | 'activo'>;
