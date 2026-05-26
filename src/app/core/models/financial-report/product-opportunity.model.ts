import type { FinancialInsightBase } from './financial-insight-base.model';

export interface ProductOpportunity extends FinancialInsightBase {
  type: 'product-opportunity';
  recipeId: string;
  recipeName: string;
  soldUnits: number;
  estimatedRevenue: number;
}
