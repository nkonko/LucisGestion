import { Timestamp } from 'firebase/firestore';

export interface PriceHistory {
  id?: string;
  ingredientId: string;
  ingredientName: string;
  previousPrice: number;
  newPrice: number;
  date: Timestamp;
}
