import { Timestamp } from 'firebase/firestore';
import type { CostFrequency } from './cost-frequency.model';
import type { CostCategory } from './cost-category.model';

export interface FixedCost {
  id?: string;
  name: string;
  description: string;
  amount: number;
  frequency: CostFrequency;
  category: CostCategory;
  active: boolean;
  startDate?: Timestamp;
  endDate?: Timestamp | null;
}

export type FixedCostInput = Omit<FixedCost, 'id'>;
export type FixedCostInputForm = Omit<FixedCost, 'id' | 'active'>;
