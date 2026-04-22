export type EstadoVenta = 'pendiente' | 'entregado' | 'cancelado';

export const ESTADOS_VENTA_DISPLAY: Record<EstadoVenta, string> = {
  pendiente: 'Pendiente',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
};

export const ESTADOS_VENTA_CLASS: Record<EstadoVenta, string> = {
  pendiente: 'stock-warning',
  entregado: 'stock-ok',
  cancelado: 'stock-danger',
};
