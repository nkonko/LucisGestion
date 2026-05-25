import type { FinancialInsight } from './financial-insight.model';

export interface ProductOpportunity extends FinancialInsight {
  type: 'product-opportunity';
  recipeId: string;
  recipeName: string;
  soldUnits: number;
  estimatedRevenue: number;
}
