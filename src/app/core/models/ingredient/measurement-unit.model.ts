export type MeasurementUnit = 'kg' | 'g' | 'lt' | 'ml' | 'unit' | 'dozen';

export const UNIT_DISPLAY: Record<MeasurementUnit, string> = {
  kg: 'Kilogramo',
  g: 'Gramo',
  lt: 'Litro',
  ml: 'Mililitro',
  unit: 'Unidad',
  dozen: 'Docena',
};
