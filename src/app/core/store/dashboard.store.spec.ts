import { TestBed } from '@angular/core/testing';
import { DashboardStore } from './dashboard.store';
import { SalesStore } from './sales.store';
import { FixedCostsStore } from './fixed-costs.store';
import { IngredientsStore } from './ingredients.store';
import { signal } from '@angular/core';
import { SelectedDate } from '../models/dashboard';
import { Timestamp } from 'firebase/firestore';

describe('DashboardStore', () => {
  let store: typeof DashboardStore;
  let salesStoreMock: jasmine.SpyObj<typeof SalesStore>;
  let fixedCostsStoreMock: jasmine.SpyObj<typeof FixedCostsStore>;
  let ingredientsStoreMock: jasmine.SpyObj<typeof IngredientsStore>;

  beforeEach(() => {
    salesStoreMock = jasmine.createSpyObj('SalesStore', [], {
      sales: signal([]),
    });

    fixedCostsStoreMock = jasmine.createSpyObj('FixedCostsStore', [], {
      allFixedCosts: signal([]),
    });

    ingredientsStoreMock = jasmine.createSpyObj('IngredientsStore', [], {
      supplyExpenses: signal([]),
    });

    TestBed.configureTestingModule({
      providers: [
        DashboardStore,
        { provide: SalesStore, useValue: salesStoreMock },
        { provide: FixedCostsStore, useValue: fixedCostsStoreMock },
        { provide: IngredientsStore, useValue: ingredientsStoreMock },
      ],
    });

    store = TestBed.inject(DashboardStore);
  });

  describe('Month Navigation', () => {
    it('should update selectedDate when going to previous month', () => {
      store.setSelectedDate({ year: 2024, month: 4 }); // May
      store.goToPreviousMonth();

      expect(store.selectedDate()).toEqual({ year: 2024, month: 3 }); // April
    });

    it('should handle year transition when going to previous month from January', () => {
      store.setSelectedDate({ year: 2024, month: 0 }); // January 2024
      store.goToPreviousMonth();

      expect(store.selectedDate()).toEqual({ year: 2023, month: 11 }); // December 2023
    });

    it('should update selectedDate when going to next month', () => {
      store.setSelectedDate({ year: 2024, month: 4 }); // May
      store.goToNextMonth();

      expect(store.selectedDate()).toEqual({ year: 2024, month: 5 }); // June
    });

    it('should handle year transition when going to next month from December', () => {
      store.setSelectedDate({ year: 2023, month: 11 }); // December 2023
      store.goToNextMonth();

      expect(store.selectedDate()).toEqual({ year: 2024, month: 0 }); // January 2024
    });

    it('should set to current month when goToCurrentMonth is called', () => {
      const now = new Date();
      store.goToCurrentMonth();

      const selected = store.selectedDate();
      expect(selected.year).toBe(now.getFullYear());
      expect(selected.month).toBe(now.getMonth());
    });

    it('should correctly identify current month', () => {
      const now = new Date();
      store.setSelectedDate({ year: now.getFullYear(), month: now.getMonth() });

      expect(store.isCurrentMonth()).toBe(true);
    });

    it('should correctly identify non-current month', () => {
      const now = new Date();
      store.setSelectedDate({ year: now.getFullYear() - 1, month: now.getMonth() });

      expect(store.isCurrentMonth()).toBe(false);
    });
  });

  describe('Sales Filtering', () => {
    it('should include sales within the period', () => {
      const date: SelectedDate = { year: 2024, month: 4 }; // May 2024
      store.setSelectedDate(date);

      // May 15, 2024
      const saleDate = new Date(2024, 4, 15);
      const mockSale = {
        id: 'sale-1',
        date: Timestamp.fromDate(saleDate),
        total: 100,
        totalCost: 50,
        profit: 50,
        items: [],
      };

      (salesStoreMock.sales as any).set([mockSale]);

      const periodSales = (store as any).periodSales;
      expect(periodSales()).toContain(mockSale);
    });

    it('should exclude sales before the period start', () => {
      const date: SelectedDate = { year: 2024, month: 4 }; // May 2024
      store.setSelectedDate(date);

      // April 30, 2024
      const saleDate = new Date(2024, 3, 30);
      const mockSale = {
        id: 'sale-1',
        date: Timestamp.fromDate(saleDate),
        total: 100,
        totalCost: 50,
        profit: 50,
        items: [],
      };

      (salesStoreMock.sales as any).set([mockSale]);

      const periodSales = (store as any).periodSales;
      expect(periodSales()).not.toContain(mockSale);
    });

    it('should exclude sales after the period end', () => {
      const date: SelectedDate = { year: 2024, month: 4 }; // May 2024
      store.setSelectedDate(date);

      // June 1, 2024 (period boundary is exclusive for end)
      const saleDate = new Date(2024, 5, 1);
      const mockSale = {
        id: 'sale-1',
        date: Timestamp.fromDate(saleDate),
        total: 100,
        totalCost: 50,
        profit: 50,
        items: [],
      };

      (salesStoreMock.sales as any).set([mockSale]);

      const periodSales = (store as any).periodSales;
      expect(periodSales()).not.toContain(mockSale);
    });
  });

  describe('Fixed Costs Calculation', () => {
    it('should include fixed costs active during the period', () => {
      const date: SelectedDate = { year: 2024, month: 4 }; // May 2024

      // Cost started before May and no endDate
      const activeCost = {
        id: 'cost-1',
        name: 'Rent',
        amount: 1000,
        frequency: 'monthly' as const,
        category: 'rent' as const,
        active: false,
        startDate: Timestamp.fromDate(new Date(2024, 0, 1)),
        endDate: null,
      };

      (fixedCostsStoreMock.allFixedCosts as any).set([activeCost]);
      store.setSelectedDate(date);

      const periodFixedCosts = (store as any).periodFixedCosts;
      expect(periodFixedCosts()).toBe(1000);
    });

    it('should include historical fixed costs that were active then but are now deactivated', () => {
      const date: SelectedDate = { year: 2024, month: 1 }; // February 2024

      // Cost that was active in Feb but deactivated in May
      const deactivatedCost = {
        id: 'cost-1',
        name: 'Old Service',
        amount: 500,
        frequency: 'monthly' as const,
        category: 'utilities' as const,
        active: false,
        startDate: Timestamp.fromDate(new Date(2024, 0, 1)),
        endDate: Timestamp.fromDate(new Date(2024, 4, 15)), // Deactivated mid-May
      };

      (fixedCostsStoreMock.allFixedCosts as any).set([deactivatedCost]);
      store.setSelectedDate(date);

      const periodFixedCosts = (store as any).periodFixedCosts;
      expect(periodFixedCosts()).toBe(500); // Should include it since it was active in Feb
    });

    it('should exclude fixed costs that ended before the period', () => {
      const date: SelectedDate = { year: 2024, month: 4 }; // May 2024

      const endedCost = {
        id: 'cost-1',
        name: 'Old Service',
        amount: 500,
        frequency: 'monthly' as const,
        category: 'utilities' as const,
        active: false,
        startDate: Timestamp.fromDate(new Date(2024, 0, 1)),
        endDate: Timestamp.fromDate(new Date(2024, 3, 15)), // Ended in April
      };

      (fixedCostsStoreMock.allFixedCosts as any).set([endedCost]);
      store.setSelectedDate(date);

      const periodFixedCosts = (store as any).periodFixedCosts;
      expect(periodFixedCosts()).toBe(0);
    });

    it('should only count monthly frequency costs', () => {
      const date: SelectedDate = { year: 2024, month: 4 }; // May 2024

      const costs = [
        {
          id: 'cost-1',
          name: 'Monthly',
          amount: 1000,
          frequency: 'monthly' as const,
          category: 'utilities' as const,
          active: false,
          startDate: Timestamp.fromDate(new Date(2024, 0, 1)),
          endDate: null,
        },
        {
          id: 'cost-2',
          name: 'Weekly',
          amount: 100,
          frequency: 'weekly' as const,
          category: 'utilities' as const,
          active: false,
          startDate: Timestamp.fromDate(new Date(2024, 0, 1)),
          endDate: null,
        },
      ];

      (fixedCostsStoreMock.allFixedCosts as any).set(costs);
      store.setSelectedDate(date);

      const periodFixedCosts = (store as any).periodFixedCosts;
      expect(periodFixedCosts()).toBe(1000); // Only monthly costs
    });
  });

  describe('Total Period Expenses', () => {
    it('should include variable costs, fixed costs, AND supply expenses', () => {
      const date: SelectedDate = { year: 2024, month: 4 }; // May 2024

      // Variable expenses from sales
      const mockSale = {
        id: 'sale-1',
        date: Timestamp.fromDate(new Date(2024, 4, 15)),
        total: 100,
        totalCost: 30,
        profit: 70,
        items: [],
      };

      // Fixed costs
      const mockFixedCost = {
        id: 'cost-1',
        name: 'Rent',
        amount: 1000,
        frequency: 'monthly' as const,
        category: 'rent' as const,
        active: false,
        startDate: Timestamp.fromDate(new Date(2024, 0, 1)),
        endDate: null,
      };

      // Supply expenses
      const mockSupplyExpense = {
        id: 'supply-1',
        date: Timestamp.fromDate(new Date(2024, 4, 10)),
        total: 200,
      };

      (salesStoreMock.sales as any).set([mockSale]);
      (fixedCostsStoreMock.allFixedCosts as any).set([mockFixedCost]);
      (ingredientsStoreMock.supplyExpenses as any).set([mockSupplyExpense]);

      store.setSelectedDate(date);

      const total = store.totalPeriodExpenses();
      expect(total).toBe(30 + 1000 + 200); // variable + fixed + supply
    });
  });

  describe('Net Profit Calculation', () => {
    it('should correctly calculate net profit', () => {
      const date: SelectedDate = { year: 2024, month: 4 }; // May 2024

      const mockSale = {
        id: 'sale-1',
        date: Timestamp.fromDate(new Date(2024, 4, 15)),
        total: 1000,
        totalCost: 300,
        profit: 700,
        items: [],
      };

      (salesStoreMock.sales as any).set([mockSale]);
      store.setSelectedDate(date);

      expect(store.monthlySales()).toBe(1000);
      expect(store.netProfit()).toBe(1000); // 1000 - 0 expenses = 1000
    });

    it('should subtract all expenses from sales', () => {
      const date: SelectedDate = { year: 2024, month: 4 }; // May 2024

      const mockSale = {
        id: 'sale-1',
        date: Timestamp.fromDate(new Date(2024, 4, 15)),
        total: 1000,
        totalCost: 300,
        profit: 700,
        items: [],
      };

      const mockFixedCost = {
        id: 'cost-1',
        name: 'Rent',
        amount: 400,
        frequency: 'monthly' as const,
        category: 'rent' as const,
        active: false,
        startDate: Timestamp.fromDate(new Date(2024, 0, 1)),
        endDate: null,
      };

      (salesStoreMock.sales as any).set([mockSale]);
      (fixedCostsStoreMock.allFixedCosts as any).set([mockFixedCost]);
      store.setSelectedDate(date);

      expect(store.netProfit()).toBe(1000 - 300 - 400); // sales - variable - fixed
    });
  });
});
