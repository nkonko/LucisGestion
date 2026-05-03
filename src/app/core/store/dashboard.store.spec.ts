import { TestBed } from '@angular/core/testing';
import { signal, WritableSignal } from '@angular/core';
import { Timestamp } from 'firebase/firestore';
import { DashboardStore } from './dashboard.store';
import { SalesStore } from './sales.store';
import { FixedCostsStore } from './fixed-costs.store';
import { IngredientsStore } from './ingredients.store';
import { SelectedDate } from '../models/dashboard';
import { Sale } from '../models/sale';
import { FixedCost } from '../models/fixed-cost';
import { SupplyExpense } from '../models/supply-expense';

describe('DashboardStore', () => {
  let store: typeof DashboardStore;
  let salesSignal: WritableSignal<Sale[]>;
  let fixedCostsSignal: WritableSignal<FixedCost[]>;
  let supplyExpensesSignal: WritableSignal<SupplyExpense[]>;

  beforeEach(() => {
    salesSignal = signal<Sale[]>([]);
    fixedCostsSignal = signal<FixedCost[]>([]);
    supplyExpensesSignal = signal<SupplyExpense[]>([]);

    TestBed.configureTestingModule({
      providers: [
        DashboardStore,
        { provide: SalesStore, useValue: { sales: salesSignal } },
        { provide: FixedCostsStore, useValue: { allFixedCosts: fixedCostsSignal } },
        { provide: IngredientsStore, useValue: { supplyExpenses: supplyExpensesSignal } },
      ],
    });

    store = TestBed.inject(DashboardStore);
  });

  const buildSale = (overrides: Partial<Sale>): Sale => ({
    date: Timestamp.fromDate(new Date(2024, 4, 15)),
    customerId: null,
    customerName: 'Consumidor final',
    items: [],
    total: 0,
    totalCost: 0,
    profit: 0,
    paymentMethod: 'cash',
    status: 'delivered',
    notes: '',
    ...overrides,
  });

  const buildFixedCost = (overrides: Partial<FixedCost>): FixedCost => ({
    name: 'Costo fijo',
    description: '',
    amount: 0,
    frequency: 'monthly',
    category: 'utilities',
    active: true,
    startDate: Timestamp.fromDate(new Date(2024, 0, 1)),
    endDate: null,
    ...overrides,
  });

  const buildSupplyExpense = (overrides: Partial<SupplyExpense>): SupplyExpense => ({
    date: Timestamp.fromDate(new Date(2024, 4, 10)),
    description: 'Compra',
    items: [],
    total: 0,
    supplier: 'Proveedor',
    ...overrides,
  });

  describe('Month Navigation', () => {
    it('should update selectedDate when going to previous month', () => {
      store.setSelectedDate({ year: 2024, month: 4 });
      store.goToPreviousMonth();

      expect(store.selectedDate()).toEqual({ year: 2024, month: 3 });
    });

    it('should handle year transition when going to previous month from January', () => {
      store.setSelectedDate({ year: 2024, month: 0 });
      store.goToPreviousMonth();

      expect(store.selectedDate()).toEqual({ year: 2023, month: 11 });
    });

    it('should update selectedDate when going to next month', () => {
      store.setSelectedDate({ year: 2024, month: 4 });
      store.goToNextMonth();

      expect(store.selectedDate()).toEqual({ year: 2024, month: 5 });
    });

    it('should handle year transition when going to next month from December', () => {
      store.setSelectedDate({ year: 2023, month: 11 });
      store.goToNextMonth();

      expect(store.selectedDate()).toEqual({ year: 2024, month: 0 });
    });

    it('should set current month when goToCurrentMonth is called', () => {
      const now = new Date();
      store.goToCurrentMonth();

      expect(store.selectedDate()).toEqual({
        year: now.getFullYear(),
        month: now.getMonth(),
      });
    });
  });

  describe('Sales Filtering', () => {
    it('should include sales inside the selected month', () => {
      store.setSelectedDate({ year: 2024, month: 4 });
      salesSignal.set([
        buildSale({ total: 100, totalCost: 50, profit: 50, date: Timestamp.fromDate(new Date(2024, 4, 15)) }),
      ]);

      expect(store.monthlySales()).toBe(100);
      expect(store.monthlyExpenses()).toBe(50);
      expect(store.monthlyProfit()).toBe(50);
    });

    it('should exclude sales before the selected month', () => {
      store.setSelectedDate({ year: 2024, month: 4 });
      salesSignal.set([
        buildSale({ total: 100, totalCost: 50, profit: 50, date: Timestamp.fromDate(new Date(2024, 3, 30)) }),
      ]);

      expect(store.monthlySales()).toBe(0);
      expect(store.monthlyExpenses()).toBe(0);
    });

    it('should exclude sales on the first day of next month', () => {
      store.setSelectedDate({ year: 2024, month: 4 });
      salesSignal.set([
        buildSale({ total: 100, totalCost: 50, profit: 50, date: Timestamp.fromDate(new Date(2024, 5, 1)) }),
      ]);

      expect(store.monthlySales()).toBe(0);
      expect(store.monthlyExpenses()).toBe(0);
    });
  });

  describe('Fixed Costs Calculation', () => {
    it('should include costs active in the selected historical period even if currently deactivated', () => {
      store.setSelectedDate({ year: 2024, month: 1 });
      fixedCostsSignal.set([
        buildFixedCost({
          amount: 500,
          active: false,
          startDate: Timestamp.fromDate(new Date(2024, 0, 1)),
          endDate: Timestamp.fromDate(new Date(2024, 4, 15)),
        }),
      ]);

      expect(store.periodFixedCosts()).toBe(500);
    });

    it('should exclude fixed costs ended before the selected period', () => {
      store.setSelectedDate({ year: 2024, month: 4 });
      fixedCostsSignal.set([
        buildFixedCost({
          amount: 500,
          active: false,
          startDate: Timestamp.fromDate(new Date(2024, 0, 1)),
          endDate: Timestamp.fromDate(new Date(2024, 3, 15)),
        }),
      ]);

      expect(store.periodFixedCosts()).toBe(0);
    });

    it('should ignore legacy non-monthly frequencies', () => {
      store.setSelectedDate({ year: 2024, month: 4 });
      fixedCostsSignal.set([
        buildFixedCost({ amount: 1000 }),
        buildFixedCost({
          amount: 100,
          frequency: 'weekly' as unknown as FixedCost['frequency'],
        }),
      ]);

      expect(store.periodFixedCosts()).toBe(1000);
    });
  });

  describe('Supply Expenses', () => {
    it('should include supply expenses inside selected month', () => {
      store.setSelectedDate({ year: 2024, month: 4 });
      supplyExpensesSignal.set([
        buildSupplyExpense({ total: 200, date: Timestamp.fromDate(new Date(2024, 4, 10)) }),
      ]);

      expect(store.periodSupplyExpenses()).toBe(200);
    });
  });

  describe('Totals and Net Profit', () => {
    it('should include variable, fixed, and supply expenses in totalPeriodExpenses', () => {
      store.setSelectedDate({ year: 2024, month: 4 });
      salesSignal.set([
        buildSale({ total: 100, totalCost: 30, profit: 70, date: Timestamp.fromDate(new Date(2024, 4, 15)) }),
      ]);
      fixedCostsSignal.set([buildFixedCost({ amount: 1000 })]);
      supplyExpensesSignal.set([
        buildSupplyExpense({ total: 200, date: Timestamp.fromDate(new Date(2024, 4, 10)) }),
      ]);

      expect(store.totalPeriodExpenses()).toBe(1230);
      expect(store.netProfit()).toBe(100 - 1230);
    });

    it('should compute net profit with no extra expenses', () => {
      store.setSelectedDate({ year: 2024, month: 4 });
      salesSignal.set([
        buildSale({ total: 1000, totalCost: 0, profit: 1000, date: Timestamp.fromDate(new Date(2024, 4, 15)) }),
      ]);

      expect(store.netProfit()).toBe(1000);
    });
  });
});
