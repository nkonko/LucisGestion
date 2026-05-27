export type SaleStatus = 'pending' | 'production' | 'delivered' | 'cancelled';

export const SALE_STATUS_DISPLAY: Record<SaleStatus, string> = {
  pending: 'Pendiente',
  production: 'En Producción',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};

export const SALE_STATUS_CLASS: Record<SaleStatus, string> = {
  pending: 'stock-warning',
  production: 'stock-warning',
  delivered: 'stock-ok',
  cancelled: 'stock-danger',
};
