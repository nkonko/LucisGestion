export type ImportanceTier = 'alto' | 'medio' | 'bajo';

export interface CustomerImportance {
  customerId: string | null;
  customerName: string;
  revenue: number;
  ordersCount: number;
  lastPurchaseAt: Date | null;
  importanceTier: ImportanceTier;
  retentionHint: string;
}
