import { fromMonthInputValue, toMonthInputValue, getPeriodStart, getPeriodEnd, formatPeriodLabel } from './dashboard.utils';
import { SelectedDate } from '../models/dashboard';

describe('Dashboard Utils', () => {
  describe('fromMonthInputValue', () => {
    it('should parse valid YYYY-MM format', () => {
      const result = fromMonthInputValue('2024-05');
      expect(result).toEqual({ year: 2024, month: 4 }); // month is 0-indexed
    });

    it('should return null for invalid format (no hyphen)', () => {
      const result = fromMonthInputValue('202405');
      expect(result).toBeNull();
    });

    it('should return null for empty string', () => {
      const result = fromMonthInputValue('');
      expect(result).toBeNull();
    });

    it('should return null for non-string input', () => {
      const invalidInput = null as unknown as string;
      const result = fromMonthInputValue(invalidInput);
      expect(result).toBeNull();
    });

    it('should return null if year is NaN', () => {
      const result = fromMonthInputValue('abc-05');
      expect(result).toBeNull();
    });

    it('should return null if month is NaN', () => {
      const result = fromMonthInputValue('2024-abc');
      expect(result).toBeNull();
    });

    it('should return null for month < 1', () => {
      const result = fromMonthInputValue('2024-00');
      expect(result).toBeNull();
    });

    it('should return null for month > 12', () => {
      const result = fromMonthInputValue('2024-13');
      expect(result).toBeNull();
    });

    it('should handle January (month 1)', () => {
      const result = fromMonthInputValue('2024-01');
      expect(result).toEqual({ year: 2024, month: 0 });
    });

    it('should handle December (month 12)', () => {
      const result = fromMonthInputValue('2024-12');
      expect(result).toEqual({ year: 2024, month: 11 });
    });

    it('should return null for too many parts', () => {
      const result = fromMonthInputValue('2024-05-15');
      expect(result).toBeNull();
    });

    it('should return null for extra whitespace parts', () => {
      const result = fromMonthInputValue('2024 - 05');
      expect(result).toBeNull();
    });
  });

  describe('toMonthInputValue', () => {
    it('should format SelectedDate to YYYY-MM string', () => {
      const date: SelectedDate = { year: 2024, month: 4 }; // May
      const result = toMonthInputValue(date);
      expect(result).toBe('2024-05');
    });

    it('should pad month with leading zero', () => {
      const date: SelectedDate = { year: 2024, month: 0 }; // January
      const result = toMonthInputValue(date);
      expect(result).toBe('2024-01');
    });
  });

  describe('getPeriodStart & getPeriodEnd', () => {
    it('should return first day of month at 00:00:00', () => {
      const date: SelectedDate = { year: 2024, month: 4 }; // May 2024
      const start = getPeriodStart('month', date);
      expect(start.getFullYear()).toBe(2024);
      expect(start.getMonth()).toBe(4);
      expect(start.getDate()).toBe(1);
      expect(start.getHours()).toBe(0);
      expect(start.getMinutes()).toBe(0);
    });

    it('should return first day of next month at 00:00:00', () => {
      const date: SelectedDate = { year: 2024, month: 4 }; // May 2024
      const end = getPeriodEnd('month', date);
      expect(end.getFullYear()).toBe(2024);
      expect(end.getMonth()).toBe(5); // June
      expect(end.getDate()).toBe(1);
    });

    it('should handle December transition correctly', () => {
      const date: SelectedDate = { year: 2024, month: 11 }; // December 2024
      const end = getPeriodEnd('month', date);
      expect(end.getFullYear()).toBe(2025);
      expect(end.getMonth()).toBe(0); // January
      expect(end.getDate()).toBe(1);
    });
  });

  describe('formatPeriodLabel', () => {
    it('should format date in es-AR locale', () => {
      const date: SelectedDate = { year: 2024, month: 4 }; // May 2024
      const label = formatPeriodLabel(date);
      expect(label).toContain('2024');
      expect(label.toLowerCase()).toContain('mayo');
    });
  });
});
