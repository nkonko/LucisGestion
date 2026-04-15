import { Ingrediente, RecetaIngrediente } from '../models/ingrediente';

export function calcularCostoReceta(
  ingredientesReceta: RecetaIngrediente[],
  ingredientesActuales: Ingrediente[],
): number {
  let costoTotal = 0;
  for (const ingredienteReceta of ingredientesReceta) {
    const ingredienteActual = ingredientesActuales.find(
      (ingrediente) => ingrediente.id === ingredienteReceta.ingredienteId,
    );
    if (ingredienteActual) {
      costoTotal += ingredienteReceta.cantidad * ingredienteActual.precioUnitario;
    }
  }
  return Math.round(costoTotal * 100) / 100;
}

export function calcularPrecioSugerido(costo: number, margenPorcentaje: number): number {
  return Math.ceil(costo * (1 + margenPorcentaje / 100));
}
