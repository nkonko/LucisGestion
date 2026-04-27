export type SaleStatus = 'pending' | 'delivered' | 'cancelled';

export const SALE_STATUS_DISPLAY: Record<SaleStatus, string> = {
  pending: 'Pendiente',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};

export const SALE_STATUS_CLASS: Record<SaleStatus, string> = {
  pending: 'stock-warning',
  delivered: 'stock-ok',
  cancelled: 'stock-danger',
};
