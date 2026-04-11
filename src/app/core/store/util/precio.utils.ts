// core/utils/precio.utils.ts
import { Ingrediente, RecetaIngrediente } from '../../models/ingrediente.model';

export function calcularCostoReceta(
  ingredientesReceta: RecetaIngrediente[],
  ingredientesActuales: Ingrediente[],
): number {
  let costoTotal = 0;
  for (const ri of ingredientesReceta) {
    const ing = ingredientesActuales.find((i) => i.id === ri.ingredienteId);
    if (ing) {
      costoTotal += ri.cantidad * ing.precioUnitario;
    }
  }
  return Math.round(costoTotal * 100) / 100;
}

export function calcularPrecioSugerido(costo: number, margenPorcentaje: number): number {
  return Math.ceil(costo * (1 + margenPorcentaje / 100));
}
