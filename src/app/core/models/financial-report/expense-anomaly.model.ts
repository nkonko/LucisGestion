import type { CostCategory } from '../fixed-cost';
import type { FinancialInsightBase } from './financial-insight-base.model';

export interface ExpenseAnomaly extends FinancialInsightBase {
  type: 'expense-anomaly';
  severity: 'warning' | 'critical';
  category: CostCategory;
  currentAmount: number;
  baselineAmount: number;
  increaseRatio: number;
}
