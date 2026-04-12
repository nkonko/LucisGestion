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

export type CostoFijoInput = Omit<CostoFijo, 'id'>;
export type CostoFijoInputForm = Omit<CostoFijo, 'id' | 'activo'>;
