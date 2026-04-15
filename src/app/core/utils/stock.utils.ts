import type { Ingrediente } from '../models/ingrediente.model';

export function getStockPriority(ingrediente: Ingrediente): number {
  if (ingrediente.stockActual <= 0) {
    return 0;
  }

  if (ingrediente.stockActual <= ingrediente.stockMinimo) {
    return 1;
  }

  return 2;
}