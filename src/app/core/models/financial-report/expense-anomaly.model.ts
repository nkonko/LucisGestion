import type { CostCategory } from '../fixed-cost/cost-category.model';
import type { FinancialInsight } from './financial-insight.model';

export interface ExpenseAnomaly extends FinancialInsight {
  type: 'expense-anomaly';
  category: CostCategory;
  currentAmount: number;
  baselineAmount: number;
  increaseRatio: number;
}
