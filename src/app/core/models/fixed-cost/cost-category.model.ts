export type CostCategory = 'utilities' | 'rent' | 'wages' | 'taxes' | 'other';

export const COST_CATEGORY_DISPLAY: Record<CostCategory, string> = {
  utilities: 'Servicios (luz, gas, agua)',
  rent: 'Alquiler',
  wages: 'Sueldos',
  taxes: 'Impuestos / Monotributo',
  other: 'Otros',
};
