import { Timestamp } from 'firebase/firestore';

export interface SupplyPurchaseAtomicItem {
  ingredientId: string;
  ingredientName: string;
  quantity: number;
  unitPrice: number;
}

export interface SupplyPurchaseAtomicInput {
  expenseId: string;
  date: Timestamp;
  description: string;
  supplier: string;
  total: number;
  items: SupplyPurchaseAtomicItem[];
}
