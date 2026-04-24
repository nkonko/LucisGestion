import { Period } from '../models/dashboard';

export function getPeriodStart(_period: Period): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}
