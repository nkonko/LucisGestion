import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Timestamp } from 'firebase/firestore';
import { FinancialInsightsService } from './financial-insights.service';
import { SalesStore } from '../store/sales.store';
import { FixedCostsStore } from '../store/fixed-costs.store';
import { CustomersStore } from '../store/customers.store';
import { RecipesStore } from '../store/recipes.store';
import { IngredientsStore } from '../store/ingredients.store';
import { DashboardStore } from '../store/dashboard.store';
import type { Sale } from '../models/sale';
import type { SaleItem } from '../models/sale';
import type { CostCategory, FixedCostEntry } from '../models/fixed-cost';
import type { Customer } from '../models/customer';
import type { Recipe } from '../models/recipe';
import type { Ingredient } from '../models/ingredient';

function createSale(overrides: Partial<Sale> = {}): Sale {
  return {
    id: 'sale-default',
    date: Timestamp.fromDate(new Date(2026, 0, 15)),
    customerId: null,
    customerName: 'Consumidor Final',
    items: [],
    total: 1000,
    totalCost: 600,
    profit: 400,
    paymentMethod: 'cash',
    status: 'delivered',
    notes: '',
    ...overrides,
  };
}

function createSaleItem(overrides: Partial<SaleItem> = {}): SaleItem {
  return {
    recipeId: 'rec-default',
    name: 'Producto',
    quantity: 1,
    unitPrice: 1000,
    unitCost: 600,
    ...overrides,
  };
}

describe('FinancialInsightsService', () => {
  let service: FinancialInsightsService;
  let salesSignal: ReturnType<typeof signal<Sale[]>>;
  let customersSignal: ReturnType<typeof signal<Customer[]>>;
  let recipesSignal: ReturnType<typeof signal<Recipe[]>>;
  let ingredientsSignal: ReturnType<typeof signal<Ingredient[]>>;
  let selectedPeriodSignal: ReturnType<typeof signal<string>>;
  let selectedDateSignal: ReturnType<typeof signal<{ year: number; month: number }>>;
  let entriesForMonthMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    salesSignal = signal<Sale[]>([]);
    customersSignal = signal<Customer[]>([]);
    recipesSignal = signal<Recipe[]>([]);
    ingredientsSignal = signal<Ingredient[]>([]);
    selectedPeriodSignal = signal<string>('month');
    selectedDateSignal = signal<{ year: number; month: number }>({ year: 2026, month: 0 });
    entriesForMonthMock = vi.fn<(...args: unknown[]) => FixedCostEntry[]>();
    entriesForMonthMock.mockReturnValue([]);

    TestBed.configureTestingModule({
      providers: [
        FinancialInsightsService,
        { provide: SalesStore, useValue: { sales: salesSignal } },
        { provide: FixedCostsStore, useValue: { entriesForMonth: entriesForMonthMock } },
        { provide: CustomersStore, useValue: { customers: customersSignal } },
        { provide: RecipesStore, useValue: { recipes: recipesSignal } },
        { provide: IngredientsStore, useValue: { ingredients: ingredientsSignal } },
        {
          provide: DashboardStore,
          useValue: {
            selectedPeriod: selectedPeriodSignal,
            selectedDate: selectedDateSignal,
          },
        },
      ],
    });

    service = TestBed.inject(FinancialInsightsService);
  });

  describe('selectedMonthKey', () => {
    it('formats the selected date as YYYY-MM', () => {
      expect(service.selectedMonthKey()).toBe('2026-01');
    });

    it('pads month with leading zero', () => {
      selectedDateSignal.set({ year: 2025, month: 11 });
      expect(service.selectedMonthKey()).toBe('2025-12');
    });
  });

  describe('salesForSelectedMonth', () => {
    it('returns sales matching the selected month', () => {
      salesSignal.set([
        createSale({ id: 's1', date: Timestamp.fromDate(new Date(2026, 0, 15)) }),
        createSale({ id: 's2', date: Timestamp.fromDate(new Date(2026, 0, 31)) }),
        createSale({ id: 's3', date: Timestamp.fromDate(new Date(2026, 1, 1)) }),
      ]);

      const result = service.salesForSelectedMonth();
      expect(result).toHaveLength(2);
      expect(result.map((s) => s.id)).toEqual(['s1', 's2']);
    });

    it('excludes cancelled sales', () => {
      salesSignal.set([
        createSale({ id: 's1', status: 'delivered' }),
        createSale({ id: 's2', status: 'cancelled' }),
      ]);

      const result = service.salesForSelectedMonth();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('s1');
    });

    it('includes sales with other statuses', () => {
      salesSignal.set([
        createSale({ id: 's1', status: 'pending' }),
        createSale({ id: 's2', status: 'delivered' }),
      ]);

      const result = service.salesForSelectedMonth();
      expect(result).toHaveLength(2);
    });
  });

  describe('customerImportance', () => {
    it('groups sales by customer and aggregates revenue and orders', () => {
      customersSignal.set([
        { id: 'cust-1', name: 'Cliente A', phone: '', address: '', notes: '', totalPurchases: 0, lastPurchase: null },
        { id: 'cust-2', name: 'Cliente B', phone: '', address: '', notes: '', totalPurchases: 0, lastPurchase: null },
      ]);
      salesSignal.set([
        createSale({ id: 's1', customerId: 'cust-1', customerName: 'Cliente A', total: 100000, date: Timestamp.fromDate(new Date(2026, 0, 10)) }),
        createSale({ id: 's2', customerId: 'cust-1', customerName: 'Cliente A', total: 50000, date: Timestamp.fromDate(new Date(2026, 0, 20)) }),
        createSale({ id: 's3', customerId: 'cust-2', customerName: 'Cliente B', total: 30000, date: Timestamp.fromDate(new Date(2026, 0, 15)) }),
      ]);

      const result = service.customerImportance();

      expect(result).toHaveLength(2);

      const a = result.find((c) => c.customerId === 'cust-1')!;
      expect(a.customerName).toBe('Cliente A');
      expect(a.revenue).toBe(150000);
      expect(a.ordersCount).toBe(2);

      const b = result.find((c) => c.customerId === 'cust-2')!;
      expect(b.customerName).toBe('Cliente B');
      expect(b.revenue).toBe(30000);
      expect(b.ordersCount).toBe(1);
    });

    it('sorts customers by revenue descending', () => {
      customersSignal.set([
        { id: 'cust-1', name: 'A', phone: '', address: '', notes: '', totalPurchases: 0, lastPurchase: null },
        { id: 'cust-2', name: 'B', phone: '', address: '', notes: '', totalPurchases: 0, lastPurchase: null },
        { id: 'cust-3', name: 'C', phone: '', address: '', notes: '', totalPurchases: 0, lastPurchase: null },
      ]);
      salesSignal.set([
        createSale({ id: 's1', customerId: 'cust-3', total: 1000 }),
        createSale({ id: 's2', customerId: 'cust-1', total: 50000 }),
        createSale({ id: 's3', customerId: 'cust-2', total: 20000 }),
      ]);

      const result = service.customerImportance();
      expect(result[0].customerId).toBe('cust-1');
      expect(result[1].customerId).toBe('cust-2');
      expect(result[2].customerId).toBe('cust-3');
    });

    it('assigns "alto" tier for revenue >= 150000', () => {
      customersSignal.set([
        { id: 'cust-1', name: 'A', phone: '', address: '', notes: '', totalPurchases: 0, lastPurchase: null },
      ]);
      salesSignal.set([createSale({ id: 's1', customerId: 'cust-1', total: 150000 })]);

      const result = service.customerImportance();
      expect(result[0].importanceTier).toBe('alto');
      expect(result[0].retentionHint).toBe('Seguimiento personalizado y contacto preventivo.');
    });

    it('assigns "alto" tier for ordersCount >= 6 regardless of revenue', () => {
      customersSignal.set([
        { id: 'cust-1', name: 'A', phone: '', address: '', notes: '', totalPurchases: 0, lastPurchase: null },
      ]);
      salesSignal.set([
        createSale({ id: 's1', customerId: 'cust-1', total: 10000 }),
        createSale({ id: 's2', customerId: 'cust-1', total: 10000 }),
        createSale({ id: 's3', customerId: 'cust-1', total: 10000 }),
        createSale({ id: 's4', customerId: 'cust-1', total: 10000 }),
        createSale({ id: 's5', customerId: 'cust-1', total: 10000 }),
        createSale({ id: 's6', customerId: 'cust-1', total: 10000 }),
      ]);

      const result = service.customerImportance();
      expect(result[0].importanceTier).toBe('alto');
    });

    it('assigns "medio" tier for revenue >= 60000', () => {
      customersSignal.set([
        { id: 'cust-1', name: 'A', phone: '', address: '', notes: '', totalPurchases: 0, lastPurchase: null },
      ]);
      salesSignal.set([createSale({ id: 's1', customerId: 'cust-1', total: 60000 })]);

      const result = service.customerImportance();
      expect(result[0].importanceTier).toBe('medio');
      expect(result[0].retentionHint).toBe('Promociones segmentadas para subir frecuencia.');
    });

    it('assigns "medio" tier for ordersCount >= 3', () => {
      customersSignal.set([
        { id: 'cust-1', name: 'A', phone: '', address: '', notes: '', totalPurchases: 0, lastPurchase: null },
      ]);
      salesSignal.set([
        createSale({ id: 's1', customerId: 'cust-1', total: 10000 }),
        createSale({ id: 's2', customerId: 'cust-1', total: 10000 }),
        createSale({ id: 's3', customerId: 'cust-1', total: 10000 }),
      ]);

      const result = service.customerImportance();
      expect(result[0].importanceTier).toBe('medio');
    });

    it('assigns "bajo" tier for low revenue and few orders', () => {
      customersSignal.set([
        { id: 'cust-1', name: 'A', phone: '', address: '', notes: '', totalPurchases: 0, lastPurchase: null },
      ]);
      salesSignal.set([createSale({ id: 's1', customerId: 'cust-1', total: 10000 })]);

      const result = service.customerImportance();
      expect(result[0].importanceTier).toBe('bajo');
      expect(result[0].retentionHint).toBe('Contacto de reactivación con oferta puntual.');
    });

    it('uses "Cliente eliminado" for unknown customer references', () => {
      salesSignal.set([createSale({ id: 's1', customerId: 'unknown-id', total: 5000 })]);

      const result = service.customerImportance();
      expect(result[0].customerName).toBe('Cliente eliminado');
    });

    it('normalises null customerId to a single anonymous entry', () => {
      salesSignal.set([
        createSale({ id: 's1', customerId: null, total: 5000 }),
        createSale({ id: 's2', customerId: null, total: 3000 }),
      ]);

      const result = service.customerImportance();
      expect(result).toHaveLength(1);
      expect(result[0].revenue).toBe(8000);
    });

    it('tracks the most recent purchase date', () => {
      customersSignal.set([
        { id: 'cust-1', name: 'A', phone: '', address: '', notes: '', totalPurchases: 0, lastPurchase: null },
      ]);
      salesSignal.set([
        createSale({ id: 's1', customerId: 'cust-1', date: Timestamp.fromDate(new Date(2026, 0, 5)) }),
        createSale({ id: 's2', customerId: 'cust-1', date: Timestamp.fromDate(new Date(2026, 0, 20)) }),
      ]);

      const result = service.customerImportance();
      expect(result[0].lastPurchaseAt!.getDate()).toBe(20);
    });
  });

  describe('productOpportunities', () => {
    const baseRecipe: Recipe = {
      id: 'rec-1',
      name: 'Torta',
      category: 'cakes',
      salePrice: 10000,
      ingredients: [],
      calculatedCost: 0,
      profitMargin: 0,
      suggestedPrice: 0,
      yield: 1,
      notes: '',
      imageUrl: '',
      active: true,
    };

    const baseIngredient: Ingredient = {
      id: 'ing-1',
      name: 'Harina',
      unit: 'kg',
      unitPrice: 10,
      currentStock: 20,
      minimumStock: 2,
      category: 'dry',
      lastPurchase: null,
      active: true,
    };

    it('returns products with sold units above the high-rotation threshold', () => {
      recipesSignal.set([
        { ...baseRecipe, id: 'rec-1', name: 'Torta', salePrice: 10000 },
        { ...baseRecipe, id: 'rec-2', name: 'Pan', salePrice: 5000 },
      ]);
      ingredientsSignal.set([baseIngredient]);
      salesSignal.set([
        createSale({ id: 's1', items: [createSaleItem({ recipeId: 'rec-1', quantity: 25 })], total: 250000 }),
        createSale({ id: 's2', items: [createSaleItem({ recipeId: 'rec-2', quantity: 5 })], total: 25000 }),
      ]);

      const result = service.productOpportunities();
      expect(result).toHaveLength(1);
      expect(result[0].recipeId).toBe('rec-1');
      expect(result[0].soldUnits).toBe(25);
    });

    it('estimates revenue based on sale price and sold units', () => {
      recipesSignal.set([{ ...baseRecipe, salePrice: 8000 }]);
      ingredientsSignal.set([baseIngredient]);
      salesSignal.set([
        createSale({ id: 's1', items: [createSaleItem({ recipeId: 'rec-1', quantity: 30 })], total: 240000 }),
      ]);

      const result = service.productOpportunities();
      expect(result[0].estimatedRevenue).toBe(240000);
    });

    it('returns empty array when no recipe exceeds the threshold', () => {
      recipesSignal.set([baseRecipe]);
      ingredientsSignal.set([baseIngredient]);
      salesSignal.set([
        createSale({ id: 's1', items: [createSaleItem({ recipeId: 'rec-1', quantity: 10 })], total: 100000 }),
      ]);

      expect(service.productOpportunities()).toEqual([]);
    });

    it('sorts opportunities by sold units descending', () => {
      recipesSignal.set([
        { ...baseRecipe, id: 'rec-1', name: 'Baja', salePrice: 1000 },
        { ...baseRecipe, id: 'rec-2', name: 'Alta', salePrice: 1000 },
      ]);
      ingredientsSignal.set([baseIngredient]);
      salesSignal.set([
        createSale({ id: 's1', items: [createSaleItem({ recipeId: 'rec-2', quantity: 40 })] }),
        createSale({ id: 's2', items: [createSaleItem({ recipeId: 'rec-1', quantity: 25 })] }),
      ]);

      const result = service.productOpportunities();
      expect(result[0].recipeId).toBe('rec-2');
      expect(result[1].recipeId).toBe('rec-1');
    });

    it('skips recipes not found in the store', () => {
      recipesSignal.set([]);
      ingredientsSignal.set([baseIngredient]);
      salesSignal.set([
        createSale({ id: 's1', items: [createSaleItem({ recipeId: 'nonexistent', quantity: 30 })] }),
      ]);

      expect(service.productOpportunities()).toEqual([]);
    });
  });

  describe('expenseAnomalies', () => {
    function makeEntry(monthKey: string, name: string, amount: number, category: CostCategory): FixedCostEntry {
      return { id: `${monthKey}-${category}`, lineageId: `l-${category}`, monthKey, name, description: '', amount, category };
    }

    function currentEntries(monthKey: string, entries: { name: string; amount: number; category: CostCategory }[]): FixedCostEntry[] {
      return entries.map((e) => makeEntry(monthKey, e.name, e.amount, e.category));
    }

    function baselineEntries(monthKey: string, amount: number, category: CostCategory = 'utilities', name = 'Electricidad'): FixedCostEntry[] {
      return [makeEntry(monthKey, name, amount, category)];
    }

    function monthKeyToYear(mk: string): number {
      return Number(mk.split('-')[0]);
    }

    function monthKeyToMonth(mk: string): number {
      return Number(mk.split('-')[1]) - 1;
    }

    function setupAnomalyTest(monthKey: string, current: { name: string; amount: number; category: CostCategory }[], baselineAmountPerCategory: { amount: number; category: CostCategory }[]): void {
      const [year, monthPadded] = monthKey.split('-');
      selectedDateSignal.set({ year: Number(year), month: Number(monthPadded) - 1 });
      entriesForMonthMock.mockImplementation((mk: string) => {
        if (mk === monthKey) return currentEntries(monthKey, current);
        return baselineAmountPerCategory.flatMap((b) => baselineEntries(mk, b.amount, b.category));
      });
    }

    it('detects anomaly when current cost exceeds baseline by at least 20%', () => {
      setupAnomalyTest('2026-06', [{ name: 'Electricidad', amount: 1200, category: 'utilities' }], [{ amount: 800, category: 'utilities' }]);

      const result = service.expenseAnomalies();
      expect(result).toHaveLength(1);
      expect(result[0].category).toBe('utilities');
      expect(result[0].currentAmount).toBe(1200);
      expect(result[0].baselineAmount).toBe(800);
      expect(result[0].increaseRatio).toBeCloseTo(0.5, 2);
      expect(result[0].severity).toBe('critical');
    });

    it('assigns "warning" severity for increases between 20% and 40%', () => {
      setupAnomalyTest('2026-03', [{ name: 'Electricidad', amount: 1100, category: 'utilities' }], [{ amount: 880, category: 'utilities' }]);

      const result = service.expenseAnomalies();
      expect(result[0].increaseRatio).toBeCloseTo(0.25, 2);
      expect(result[0].severity).toBe('warning');
    });

    it('skips categories where baseline amount is zero or negative', () => {
      setupAnomalyTest('2026-05', [{ name: 'Alquiler', amount: 5000, category: 'rent' }], []);

      const result = service.expenseAnomalies();
      expect(result).toEqual([]);
    });

    it('returns empty array when no category exceeds the threshold', () => {
      selectedDateSignal.set({ year: 2024, month: 6 });
      entriesForMonthMock.mockReturnValue([]);

      expect(service.expenseAnomalies()).toEqual([]);
    });

    it('sorts anomalies by increase ratio descending', () => {
      setupAnomalyTest('2026-04', [
        { name: 'Sueldos', amount: 3000, category: 'wages' },
        { name: 'Electricidad', amount: 1500, category: 'utilities' },
      ], [
        { amount: 1000, category: 'wages' },
        { amount: 1000, category: 'utilities' },
      ]);

      const result = service.expenseAnomalies();
      expect(result).toHaveLength(2);
      expect(result[0].category).toBe('wages');
      expect(result[1].category).toBe('utilities');
    });
  });

  describe('priorityCustomers', () => {
    it('returns customers meeting min revenue and min purchases thresholds', () => {
      customersSignal.set([
        { id: 'cust-1', name: 'VIP', phone: '', address: '', notes: '', totalPurchases: 0, lastPurchase: null },
        { id: 'cust-2', name: 'Regular', phone: '', address: '', notes: '', totalPurchases: 0, lastPurchase: null },
      ]);
      salesSignal.set([
        createSale({ id: 's1', customerId: 'cust-1', customerName: 'VIP', total: 30000 }),
        createSale({ id: 's2', customerId: 'cust-1', customerName: 'VIP', total: 20000 }),
        createSale({ id: 's3', customerId: 'cust-1', customerName: 'VIP', total: 10000 }),
        createSale({ id: 's4', customerId: 'cust-2', customerName: 'Regular', total: 60000 }),
        createSale({ id: 's5', customerId: 'cust-2', customerName: 'Regular', total: 10000 }),
      ]);

      const result = service.priorityCustomers();
      expect(result).toHaveLength(1);
      expect(result[0].customerId).toBe('cust-1');
      expect(result[0].billedAmount).toBe(60000);
      expect(result[0].purchasesCount).toBe(3);
    });

    it('excludes customers below min revenue', () => {
      customersSignal.set([
        { id: 'cust-1', name: 'Low', phone: '', address: '', notes: '', totalPurchases: 0, lastPurchase: null },
      ]);
      salesSignal.set([
        createSale({ id: 's1', customerId: 'cust-1', total: 10000 }),
        createSale({ id: 's2', customerId: 'cust-1', total: 10000 }),
        createSale({ id: 's3', customerId: 'cust-1', total: 10000 }),
      ]);

      expect(service.priorityCustomers()).toEqual([]);
    });

    it('excludes customers not in the customer store', () => {
      customersSignal.set([]);
      salesSignal.set([
        createSale({ id: 's1', customerId: 'cust-1', customerName: 'Unregistered', total: 100000 }),
      ]);

      expect(service.priorityCustomers()).toEqual([]);
    });

    it('skips sales without a customerId', () => {
      customersSignal.set([
        { id: 'cust-1', name: 'Known', phone: '', address: '', notes: '', totalPurchases: 0, lastPurchase: null },
      ]);
      salesSignal.set([
        createSale({ id: 's1', customerId: null, total: 100000 }),
        createSale({ id: 's2', customerId: 'cust-1', total: 60000 }),
        createSale({ id: 's3', customerId: 'cust-1', total: 50000 }),
        createSale({ id: 's4', customerId: 'cust-1', total: 40000 }),
      ]);

      const result = service.priorityCustomers();
      expect(result).toHaveLength(1);
      expect(result[0].customerId).toBe('cust-1');
    });

    it('sorts by billed amount descending', () => {
      customersSignal.set([
        { id: 'c1', name: 'Top', phone: '', address: '', notes: '', totalPurchases: 0, lastPurchase: null },
        { id: 'c2', name: 'Bottom', phone: '', address: '', notes: '', totalPurchases: 0, lastPurchase: null },
      ]);
      salesSignal.set([
        createSale({ id: 's1', customerId: 'c2', total: 60000 }),
        createSale({ id: 's2', customerId: 'c2', total: 10000 }),
        createSale({ id: 's3', customerId: 'c2', total: 10000 }),
        createSale({ id: 's4', customerId: 'c1', total: 100000 }),
        createSale({ id: 's5', customerId: 'c1', total: 10000 }),
        createSale({ id: 's6', customerId: 'c1', total: 10000 }),
      ]);

      const result = service.priorityCustomers();
      expect(result[0].customerId).toBe('c1');
      expect(result[1].customerId).toBe('c2');
    });
  });

  describe('insights', () => {
    it('combines product opportunities, expense anomalies, and priority customers', () => {
      const baseRecipe: Recipe = {
        id: 'rec-1', name: 'Alta Rotación', category: 'cakes', salePrice: 1000, ingredients: [],
        calculatedCost: 0, profitMargin: 0, suggestedPrice: 0, yield: 1, notes: '', imageUrl: '', active: true,
      };
      recipesSignal.set([baseRecipe]);
      customersSignal.set([
        { id: 'cust-1', name: 'VIP', phone: '', address: '', notes: '', totalPurchases: 0, lastPurchase: null },
      ]);
      ingredientsSignal.set([
        { id: 'ing-1', name: 'Harina', unit: 'kg', unitPrice: 10, currentStock: 20, minimumStock: 2, category: 'dry', lastPurchase: null, active: true },
      ]);
      salesSignal.set([
        createSale({ id: 's1', customerId: 'cust-1', customerName: 'VIP', total: 60000, items: [createSaleItem({ recipeId: 'rec-1', quantity: 25 })] }),
        createSale({ id: 's2', customerId: 'cust-1', customerName: 'VIP', total: 10000 }),
        createSale({ id: 's3', customerId: 'cust-1', customerName: 'VIP', total: 10000 }),
      ]);

      selectedDateSignal.set({ year: 2026, month: 0 });
      entriesForMonthMock.mockImplementation((monthKey: string) => {
        if (monthKey === '2026-01') return [{ id: 'c1', lineageId: 'lx', monthKey: '2026-01', name: 'Luz', description: '', amount: 1000, category: 'utilities' }];
        return [{ id: 'b1', lineageId: 'lx', monthKey: monthKey, name: 'Luz', description: '', amount: 500, category: 'utilities' }];
      });

      const result = service.insights();
      expect(result.length).toBeGreaterThanOrEqual(2);

      const types = result.map((i) => i.type);
      expect(types).toContain('product-opportunity');
      expect(types).toContain('priority-customer');
    });

    it('returns empty array when there are no insights', () => {
      expect(service.insights()).toEqual([]);
    });
  });
});
