import { Timestamp } from 'firebase/firestore';
import type { MovementType } from './movement-type.model';

export interface StockMovement {
  id?: string;
  ingredientId: string;
  ingredientName: string;
  type: MovementType;
  quantity: number;
  date: Timestamp;
  saleId: string | null;
}

export type StockMovementInput = Omit<StockMovement, 'id'>;
