export type SaleStatus = 'draft' | 'pending' | 'production' | 'delivered' | 'cancelled';

export const SALE_STATUS_DISPLAY: Record<SaleStatus, string> = {
  draft: 'Borrador',
  pending: 'Pendiente',
  production: 'En Producción',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};

export const SALE_STATUS_CLASS: Record<SaleStatus, string> = {
  draft: 'status-draft',
  pending: 'stock-warning',
  production: 'stock-warning',
  delivered: 'stock-ok',
  cancelled: 'stock-danger',
};
