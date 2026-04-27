import { Timestamp } from 'firebase/firestore';
import type { ExpenseItem } from '../ingredient/expense-item.model';

export interface SupplyExpense {
  id?: string;
  date: Timestamp;
  description: string;
  items: ExpenseItem[];
  total: number;
  supplier: string;
}

export type SupplyExpenseInput = Omit<SupplyExpense, 'id'>;
