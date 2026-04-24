import { Timestamp } from 'firebase/firestore';
import type { SaleStatus } from './sale-status.model';
import type { SaleItem } from './sale-item.model';
import { PaymentMethod } from './payment-method.model';

export interface Sale {
  id?: string;
  date: Timestamp;
  customerId: string | null;
  customerName: string;
  items: SaleItem[];
  total: number;
  totalCost: number;
  profit: number;
  paymentMethod: PaymentMethod;
  status: SaleStatus;
  notes: string;
}

export type SaleInput = Omit<Sale, 'id'>;
