import { Timestamp } from 'firebase/firestore';

export interface Customer {
  id?: string;
  name: string;
  phone: string;
  address: string;
  notes: string;
  totalPurchases: number;
  lastPurchase: Timestamp | null;
}

export type CustomerInput = Omit<Customer, 'id'>;
