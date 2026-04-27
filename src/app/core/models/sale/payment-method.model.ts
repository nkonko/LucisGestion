export type PaymentMethod = 'cash' | 'transfer' | 'mercadopago';

export const PAYMENT_METHOD_DISPLAY: Record<PaymentMethod, string> = {
  cash: 'Efectivo',
  transfer: 'Transferencia',
  mercadopago: 'MercadoPago',
};
