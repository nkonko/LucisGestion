import { Period } from '../models/dashboard';
import { SelectedDate } from '../models/dashboard';

export function getPeriodStart(period: Period, selectedDate: SelectedDate): Date {
  const now = new Date();
  switch (period) {
    case 'today': {
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }
    case 'week': {
      const day = now.getDay();
      const diff = now.getDate() - day;
      return new Date(now.getFullYear(), now.getMonth(), diff);
    }
    case 'month': {
      return new Date(selectedDate.year, selectedDate.month, 1);
    }
    case 'year': {
      return new Date(selectedDate.year, 0, 1);
    }
  }
}

export function getPeriodEnd(period: Period, selectedDate: SelectedDate): Date {
  const now = new Date();
  switch (period) {
    case 'today': {
      const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow;
    }
    case 'week': {
      const day = now.getDay();
      const diff = now.getDate() - day + 7;
      return new Date(now.getFullYear(), now.getMonth(), diff);
    }
    case 'month': {
      return new Date(selectedDate.year, selectedDate.month + 1, 1);
    }
    case 'year': {
      return new Date(selectedDate.year + 1, 0, 1);
    }
  }
}

export function formatPeriodLabel(selectedDate: SelectedDate, period: Period = 'month'): string {
  switch (period) {
    case 'today':
      return 'Hoy';
    case 'week':
      return 'Esta semana';
    case 'year':
      return String(selectedDate.year);
    case 'month': {
      const date = new Date(selectedDate.year, selectedDate.month, 1);
      const formatted = new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric' }).format(date);
      return formatted.charAt(0).toLocaleUpperCase('es-AR') + formatted.slice(1);
    }
  }
}

export function toMonthInputValue(selectedDate: SelectedDate): string {
  const mm = String(selectedDate.month + 1).padStart(2, '0');
  return `${selectedDate.year}-${mm}`;
}

export function fromMonthInputValue(value: string): SelectedDate | null {
  if (!value || typeof value !== 'string') return null;

  if (!/^\d{4}-\d{2}$/.test(value)) return null;

  const parts = value.split('-');
  if (parts.length !== 2) return null;

  const year = Number(parts[0]);
  const month = Number(parts[1]);

  if (isNaN(year) || isNaN(month)) return null;
  if (month < 1 || month > 12) return null;

  return { year, month: month - 1 };
}
