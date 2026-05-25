export type FinancialInsightType = 'product-opportunity' | 'expense-anomaly' | 'priority-customer';

export type FinancialInsightSeverity = 'info' | 'warning' | 'critical';

export interface FinancialInsight {
  id: string;
  type: FinancialInsightType;
  severity: FinancialInsightSeverity;
  title: string;
  description: string;
  impact: string;
  recommendation: string;
}
