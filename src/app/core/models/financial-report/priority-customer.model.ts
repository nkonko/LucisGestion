import type { FinancialInsightBase } from './financial-insight-base.model';

export interface PriorityCustomer extends FinancialInsightBase {
  type: 'priority-customer';
  customerId: string;
  customerName: string;
  billedAmount: number;
  purchasesCount: number;
}
