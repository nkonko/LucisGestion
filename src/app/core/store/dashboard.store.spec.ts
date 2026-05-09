import { TestBed } from '@angular/core/testing';
import { signal, WritableSignal } from '@angular/core';
import { Timestamp } from 'firebase/firestore';
import { DashboardStore } from './dashboard.store';
import { DashboardMetricsService } from '../services/dashboard-metrics.service';
import { SalesStore } from './sales.store';
import { FixedCostsStore } from './fixed-costs.store';
import { IngredientsStore } from './ingredients.store';
import { RecipesStore } from './recipes.store';
import { Sale } from '../models/sale';
import { SupplyExpense } from '../models/supply-expense';
import { Recipe } from '../models/recipe';

describe('DashboardStore (UI state)', () => {
  let store: InstanceType<typeof DashboardStore>;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [DashboardStore] });
    store = TestBed.inject(DashboardStore);
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
  });
});

describe('DashboardMetricsService', () => {
  let store: InstanceType<typeof DashboardStore>;
  let metrics: DashboardMetricsService;
  let salesSignal: WritableSignal<Sale[]>;
  let supplyExpensesSignal: WritableSignal<SupplyExpense[]>;
  let recipesSignal: WritableSignal<Recipe[]>;
  let totalForMonthSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    salesSignal = signal<Sale[]>([]);
    supplyExpensesSignal = signal<SupplyExpense[]>([]);
    recipesSignal = signal<Recipe[]>([]);
    totalForMonthSpy = vi.fn().mockReturnValue(0);

    TestBed.configureTestingModule({
      providers: [
        DashboardStore,
        DashboardMetricsService,
        { provide: SalesStore, useValue: { sales: salesSignal } },
        { provide: FixedCostsStore, useValue: { totalForMonth: totalForMonthSpy } },
        { provide: IngredientsStore, useValue: { supplyExpenses: supplyExpensesSignal } },
        { provide: RecipesStore, useValue: { recipes: recipesSignal } },
      ],
    });

    store = TestBed.inject(DashboardStore);
    metrics = TestBed.inject(DashboardMetricsService);
  });

  function buildSale(overrides: Partial<Sale>): Sale {
    return {
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
    };
  }

  function buildRecipe(overrides: Partial<Recipe>): Recipe {
    return {
      id: 'recipe-1',
      name: 'Receta',
      category: 'cakes',
      ingredients: [],
      calculatedCost: 0,
      profitMargin: 0,
      suggestedPrice: 0,
      salePrice: 0,
      yield: 1,
      notes: '',
      imageUrl: '',
      active: true,
      ...overrides,
    };
  }

  function buildSupplyExpense(overrides: Partial<SupplyExpense>): SupplyExpense {
    return {
      date: Timestamp.fromDate(new Date(2024, 4, 10)),
      description: 'Compra',
      items: [],
      total: 0,
      supplier: 'Proveedor',
      ...overrides,
    };
  }

  describe('Sales Filtering', () => {
    it('should include sales inside the selected month', () => {
      store.setSelectedDate({ year: 2024, month: 4 });
      salesSignal.set([
        buildSale({ total: 100, date: Timestamp.fromDate(new Date(2024, 4, 15)) }),
      ]);

      expect(metrics.monthlySales()).toBe(100);
    });

    it('should exclude sales outside selected month', () => {
      store.setSelectedDate({ year: 2024, month: 4 });
      salesSignal.set([
        buildSale({ total: 100, date: Timestamp.fromDate(new Date(2024, 5, 1)) }),
      ]);

      expect(metrics.monthlySales()).toBe(0);
    });
  });

  describe('COGS Calculation', () => {
    it('should calculate COGS from recipe cost divided by yield', () => {
      store.setSelectedDate({ year: 2024, month: 4 });
      recipesSignal.set([
        buildRecipe({ id: 'recipe-1', calculatedCost: 200, yield: 4 }),
      ]);
      salesSignal.set([
        buildSale({
          total: 600,
          items: [
            { recipeId: 'recipe-1', name: 'Producto', quantity: 3, unitPrice: 200, unitCost: 0 },
          ],
          date: Timestamp.fromDate(new Date(2024, 4, 15)),
        }),
      ]);

      expect(metrics.monthlyExpenses()).toBe(150);
    });
  });

  describe('Fixed Costs', () => {
    it('should request fixed costs with YYYY-MM month key', () => {
      store.setSelectedDate({ year: 2024, month: 4 });
      totalForMonthSpy.mockReturnValue(900);

      expect(metrics.periodFixedCosts()).toBe(900);
      expect(totalForMonthSpy).toHaveBeenCalledWith('2024-05');
    });
  });

  describe('Supply Expenses', () => {
    it('should include supply expenses inside selected month', () => {
      store.setSelectedDate({ year: 2024, month: 4 });
      supplyExpensesSignal.set([
        buildSupplyExpense({ total: 200, date: Timestamp.fromDate(new Date(2024, 4, 10)) }),
      ]);

      expect(metrics.periodSupplyExpenses()).toBe(200);
    });
  });

  describe('Totals and Net Profit', () => {
    it('should compute total expenses and net profit', () => {
      store.setSelectedDate({ year: 2024, month: 4 });
      recipesSignal.set([
        buildRecipe({ id: 'recipe-1', calculatedCost: 100, yield: 1 }),
      ]);
      salesSignal.set([
        buildSale({
          total: 500,
          items: [
            { recipeId: 'recipe-1', name: 'Producto', quantity: 2, unitPrice: 250, unitCost: 0 },
          ],
          date: Timestamp.fromDate(new Date(2024, 4, 15)),
        }),
      ]);
      totalForMonthSpy.mockReturnValue(75);

      expect(metrics.monthlyExpenses()).toBe(200);
      expect(metrics.totalPeriodExpenses()).toBe(275);
      expect(metrics.netProfit()).toBe(225);
    });
  });
});
