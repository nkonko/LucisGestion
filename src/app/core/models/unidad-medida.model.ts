export type UnidadMedida = 'kg' | 'g' | 'lt' | 'ml' | 'unidad' | 'docena';

export const UNIDADES_DISPLAY: Record<UnidadMedida, string> = {
  kg: 'Kilogramo',
  g: 'Gramo',
  lt: 'Litro',
  ml: 'Mililitro',
  unidad: 'Unidad',
  docena: 'Docena',
};
