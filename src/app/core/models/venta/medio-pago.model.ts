export type MedioPago = 'efectivo' | 'transferencia' | 'mercadopago';

export const MEDIOS_PAGO_DISPLAY: Record<MedioPago, string> = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  mercadopago: 'MercadoPago',
};
