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

export function fromMonthInputValue(value: string): SelectedDate {
  const [year, month] = value.split('-').map(Number);
  return { year, month: month - 1 };
}
