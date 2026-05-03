import { Period } from '../models/dashboard';
import { SelectedDate } from '../models/dashboard';

export function getPeriodStart(_period: Period, selectedDate: SelectedDate): Date {
  return new Date(selectedDate.year, selectedDate.month, 1);
}

export function getPeriodEnd(_period: Period, selectedDate: SelectedDate): Date {
  return new Date(selectedDate.year, selectedDate.month + 1, 1);
}

export function formatPeriodLabel(selectedDate: SelectedDate): string {
  const date = new Date(selectedDate.year, selectedDate.month, 1);
  return new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric' }).format(date);
}

export function toMonthInputValue(selectedDate: SelectedDate): string {
  const mm = String(selectedDate.month + 1).padStart(2, '0');
  return `${selectedDate.year}-${mm}`;
}

export function fromMonthInputValue(value: string): SelectedDate | null {
  if (!value || typeof value !== 'string') return null;

  const parts = value.split('-');
  if (parts.length !== 2) return null;

  const year = Number(parts[0]);
  const month = Number(parts[1]);

  if (isNaN(year) || isNaN(month)) return null;
  if (month < 1 || month > 12) return null;

  return { year, month: month - 1 };
}
