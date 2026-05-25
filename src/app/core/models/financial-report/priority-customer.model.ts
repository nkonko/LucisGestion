import type { FinancialInsight } from './financial-insight.model';

export interface PriorityCustomer extends FinancialInsight {
  type: 'priority-customer';
  customerId: string;
  customerName: string;
  purchasesCount: number;
  billedAmount: number;
}
