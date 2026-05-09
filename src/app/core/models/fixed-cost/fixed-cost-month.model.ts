import type { CostCategory } from './cost-category.model';

export interface FixedCostMonthDoc {
  id?: string;
  monthKey: string;
  isAnchor?: boolean;
  lineageId?: string;
  name?: string;
  description?: string;
  amount?: number;
  category?: CostCategory;
}

export interface FixedCostEntry {
  id?: string;
  lineageId: string;
  monthKey: string;
  name: string;
  description: string;
  amount: number;
  category: CostCategory;
}

export interface FixedCostEntryInput {
  name: string;
  description: string;
  amount: number;
  category: CostCategory;
}

export type FixedCostMonthStatus =
  | { kind: 'edited' }
  | { kind: 'inherited'; sourceMonthKey: string }
  | { kind: 'empty' };
