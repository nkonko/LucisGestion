export type CategoriaCosto = 'servicios' | 'alquiler' | 'sueldos' | 'impuestos' | 'otros';

export const CATEGORIA_COSTO_DISPLAY: Record<CategoriaCosto, string> = {
  servicios: 'Servicios (luz, gas, agua)',
  alquiler: 'Alquiler',
  sueldos: 'Sueldos',
  impuestos: 'Impuestos / Monotributo',
  otros: 'Otros',
};
