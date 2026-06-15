import { Period } from '../models/dashboard';
import { SelectedDate } from '../models/dashboard';

function toAnchorDate(selectedDate: SelectedDate): Date {
  return new Date(selectedDate.year, selectedDate.month, selectedDate.day ?? 1);
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfWeek(date: Date): Date {
  const day = date.getDay();
  const diff = date.getDate() - day;
  return new Date(date.getFullYear(), date.getMonth(), diff);
}

export function getPeriodStart(period: Period, selectedDate: SelectedDate): Date {
  const anchor = toAnchorDate(selectedDate);
  switch (period) {
    case 'today': {
      return startOfDay(anchor);
    }
    case 'week': {
      return startOfWeek(anchor);
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
  const anchor = toAnchorDate(selectedDate);
  switch (period) {
    case 'today': {
      const tomorrow = startOfDay(anchor);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow;
    }
    case 'week': {
      const nextWeek = startOfWeek(anchor);
      nextWeek.setDate(nextWeek.getDate() + 7);
      return nextWeek;
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
  const selected = toAnchorDate(selectedDate);
  const now = new Date();
  const isToday =
    selected.getFullYear() === now.getFullYear() &&
    selected.getMonth() === now.getMonth() &&
    selected.getDate() === now.getDate();

  switch (period) {
    case 'today': {
      if (isToday) return 'Hoy';
      return new Intl.DateTimeFormat('es-AR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }).format(selected);
    }
    case 'week': {
      const weekStart = getPeriodStart('week', selectedDate);
      const weekEnd = getPeriodEnd('week', selectedDate);
      weekEnd.setDate(weekEnd.getDate() - 1);
      const startText = new Intl.DateTimeFormat('es-AR', {
        day: '2-digit',
        month: 'short',
      }).format(weekStart);
      const endText = new Intl.DateTimeFormat('es-AR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(weekEnd);
      return `Semana ${startText} - ${endText}`;
    }
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
