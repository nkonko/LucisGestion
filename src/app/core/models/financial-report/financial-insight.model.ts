import type { ExpenseAnomaly } from './expense-anomaly.model';
import type { PriorityCustomer } from './priority-customer.model';
import type { ProductOpportunity } from './product-opportunity.model';

export type FinancialInsight = ProductOpportunity | ExpenseAnomaly | PriorityCustomer;
