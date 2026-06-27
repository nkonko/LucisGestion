import { describe, it, expect } from 'vitest';
import { Timestamp } from '@angular/fire/firestore';
import { buildDetailedTransactionRows } from './build-detailed-transactions';
import type { Sale } from '../../../core/models/sale/sale.model';
import type { SaleItem } from '../../../core/models/sale/sale-item.model';
import type { SupplyExpense } from '../../../core/models/supply-expense/supply-expense.model';
import type { FixedCostEntry } from '../../../core/models/fixed-cost/fixed-cost-month.model';

function mockTimestamp(date: Date): Timestamp {
  return Timestamp.fromDate(date);
}

function sale(overrides: { date: Date } & Partial<Omit<Sale, 'date'>>): Sale {
  return {
    id: 's1',
    deliveryDate: null,
    customerId: null,
    customerName: 'Test',
    items: [{ recipeId: 'r1', name: 'Producto', quantity: 1, unitPrice: 100, unitCost: 50 }],
    total: 100,
    totalCost: 50,
    profit: 50,
    isPaid: true,
    paymentMethod: 'cash',
    status: 'delivered',
    notes: '',
    ...overrides,
    date: mockTimestamp(overrides.date),
  };
}

function supplyExpense(overrides: { date: Date } & Partial<Omit<SupplyExpense, 'date'>>): SupplyExpense {
  return {
    id: 'e1',
    description: 'Compra de insumos',
    items: [{ ingredientId: 'i1', name: 'Harina', quantity: 2, unitPrice: 500, totalPrice: 1000 }],
    total: 1000,
    supplier: 'Proveedor',
    ...overrides,
    date: mockTimestamp(overrides.date),
  };
}

function fixedCostEntry(overrides: Partial<FixedCostEntry>): FixedCostEntry {
  return {
    id: 'fc1',
    lineageId: 'lin-1',
    monthKey: '2026-06',
    name: 'Alquiler',
    description: 'Alquiler del local',
    amount: 30000,
    category: 'rent',
    ...overrides,
  };
}

describe('buildDetailedTransactionRows', () => {
  it('merges sales, supply expenses, and fixed costs sorted by date', () => {
    const dateFrom = new Date(2026, 5, 1);
    const dateTo = new Date(2026, 6, 1);

    const sales: Sale[] = [sale({ date: new Date(2026, 5, 15), total: 15000 })];
    const supplyExpenses: SupplyExpense[] = [supplyExpense({ date: new Date(2026, 5, 10), total: 5000 })];
    const fixedCostsByMonth = new Map<string, readonly FixedCostEntry[]>([
      ['2026-06', [fixedCostEntry({ monthKey: '2026-06', name: 'Alquiler', amount: 30000, category: 'rent' })]],
    ]);

    const result = buildDetailedTransactionRows({ dateFrom, dateTo, sales, supplyExpenses, fixedCostsByMonth });

    expect(result).toHaveLength(3);
    // Sorted by date ascending: fixed (Jun 01) → supply (Jun 10) → sale (Jun 15)
    expect(result[0].date).toEqual(new Date(2026, 5, 1));
    expect(result[0].detail).toBe('Alquiler — rent');
    expect(result[0].income).toBe(0);
    expect(result[0].expense).toBe(30000);

    expect(result[1].date).toEqual(new Date(2026, 5, 10));
    expect(result[1].detail).toBe('Harina 2unid.');
    expect(result[1].income).toBe(0);
    expect(result[1].expense).toBe(5000);

    expect(result[2].date).toEqual(new Date(2026, 5, 15));
    expect(result[2].detail).toBe('Producto x1');
    expect(result[2].income).toBe(15000);
    expect(result[2].expense).toBe(0);
  });

  it('returns empty array when no data in period', () => {
    const dateFrom = new Date(2026, 5, 1);
    const dateTo = new Date(2026, 6, 1);

    const result = buildDetailedTransactionRows({
      dateFrom,
      dateTo,
      sales: [],
      supplyExpenses: [],
      fixedCostsByMonth: new Map(),
    });

    expect(result).toEqual([]);
  });

  it('filters out sales with excluded statuses (draft, production, cancelled)', () => {
    const dateFrom = new Date(2026, 5, 1);
    const dateTo = new Date(2026, 6, 1);

    const sales: Sale[] = [
      sale({ date: new Date(2026, 5, 1), status: 'delivered', total: 100 }),
      sale({ date: new Date(2026, 5, 2), status: 'pending', total: 200 }),
      sale({ date: new Date(2026, 5, 3), status: 'draft', total: 300 }),
      sale({ date: new Date(2026, 5, 4), status: 'production', total: 400 }),
      sale({ date: new Date(2026, 5, 5), status: 'cancelled', total: 500 }),
    ];

    const result = buildDetailedTransactionRows({
      dateFrom,
      dateTo,
      sales,
      supplyExpenses: [],
      fixedCostsByMonth: new Map(),
    });

    expect(result).toHaveLength(2);
    expect(result.every((row) => row.income > 0)).toBe(true);
  });

  it('includes sales on dateFrom but excludes sales on dateTo', () => {
    const dateFrom = new Date(2026, 5, 1);
    const dateTo = new Date(2026, 5, 15);

    const sales: Sale[] = [
      sale({ date: new Date(2026, 5, 1), total: 100 }),
      sale({ date: new Date(2026, 5, 14), total: 200 }),
      sale({ date: new Date(2026, 5, 15), total: 300 }),
      sale({ date: new Date(2026, 5, 16), total: 400 }),
    ];

    const result = buildDetailedTransactionRows({
      dateFrom,
      dateTo,
      sales,
      supplyExpenses: [],
      fixedCostsByMonth: new Map(),
    });

    expect(result).toHaveLength(2);
    expect(result.map((row) => row.income)).toEqual([100, 200]);
  });

  it('breaks ties by putting income rows before expense rows on same date', () => {
    const dateFrom = new Date(2026, 5, 1);
    const dateTo = new Date(2026, 6, 1);

    const sameDate = new Date(2026, 5, 15);

    const sales: Sale[] = [sale({ date: sameDate, total: 15000 })];
    const supplyExpenses: SupplyExpense[] = [supplyExpense({ date: sameDate, total: 5000 })];
    // Fixed cost for June 2026 — creates a date of June 1, which is different from June 15
    const fixedCostsByMonth = new Map<string, readonly FixedCostEntry[]>([
      ['2026-06', [fixedCostEntry({ monthKey: '2026-06', name: 'Seguro', amount: 10000, category: 'other' })]],
    ]);

    const result = buildDetailedTransactionRows({ dateFrom, dateTo, sales, supplyExpenses, fixedCostsByMonth });

    // Fixed cost date is June 1 (always first-of-month), so it sorts first
    expect(result).toHaveLength(3);
    expect(result[0].date).toEqual(new Date(2026, 5, 1));
    expect(result[0].expense).toBe(10000);

    // Sale and supply expense are both on June 15 — income before expense
    expect(result[1].income).toBe(15000);
    expect(result[1].expense).toBe(0);
    expect(result[2].income).toBe(0);
    expect(result[2].expense).toBe(5000);
  });

  it('handles single-source: only sales', () => {
    const dateFrom = new Date(2026, 5, 1);
    const dateTo = new Date(2026, 6, 1);

    const sales: Sale[] = [
      sale({ date: new Date(2026, 5, 10), total: 5000 }),
      sale({ date: new Date(2026, 5, 20), total: 8000 }),
    ];

    const result = buildDetailedTransactionRows({
      dateFrom,
      dateTo,
      sales,
      supplyExpenses: [],
      fixedCostsByMonth: new Map(),
    });

    expect(result).toHaveLength(2);
    expect(result.every((row) => row.income > 0 && row.expense === 0)).toBe(true);
  });

  it('handles single-source: only expenses (supply + fixed)', () => {
    const dateFrom = new Date(2026, 5, 1);
    const dateTo = new Date(2026, 6, 1);

    const supplyExpenses: SupplyExpense[] = [
      supplyExpense({ date: new Date(2026, 5, 10), total: 2000 }),
    ];
    const fixedCostsByMonth = new Map<string, readonly FixedCostEntry[]>([
      ['2026-06', [fixedCostEntry({ monthKey: '2026-06', name: 'Sueldos', amount: 50000, category: 'wages' })]],
    ]);

    const result = buildDetailedTransactionRows({
      dateFrom,
      dateTo,
      sales: [],
      supplyExpenses,
      fixedCostsByMonth,
    });

    expect(result).toHaveLength(2);
    expect(result.every((row) => row.income === 0 && row.expense > 0)).toBe(true);
  });

  it('includes fixed costs from multiple months when period spans several months', () => {
    const dateFrom = new Date(2026, 4, 15);
    const dateTo = new Date(2026, 6, 15);

    const fixedCostsByMonth = new Map<string, readonly FixedCostEntry[]>([
      ['2026-05', [fixedCostEntry({ monthKey: '2026-05', name: 'Alquiler', amount: 30000, category: 'rent' })]],
      ['2026-06', [fixedCostEntry({ monthKey: '2026-06', name: 'Alquiler', amount: 30000, category: 'rent' })]],
      ['2026-07', [fixedCostEntry({ monthKey: '2026-07', name: 'Alquiler', amount: 30000, category: 'rent' })]],
    ]);

    const result = buildDetailedTransactionRows({
      dateFrom,
      dateTo,
      sales: [],
      supplyExpenses: [],
      fixedCostsByMonth,
    });

    expect(result).toHaveLength(3);
    expect(result[0].date).toEqual(new Date(2026, 4, 1));
    expect(result[1].date).toEqual(new Date(2026, 5, 1));
    expect(result[2].date).toEqual(new Date(2026, 6, 1));
  });

  it('builds detail string for sale with 5 items', () => {
    const dateFrom = new Date(2026, 5, 1);
    const dateTo = new Date(2026, 6, 1);

    const items: SaleItem[] = [
      { recipeId: 'r1', name: 'Torta', quantity: 1, unitPrice: 100, unitCost: 50 },
      { recipeId: 'r2', name: 'Café', quantity: 3, unitPrice: 50, unitCost: 20 },
      { recipeId: 'r3', name: 'Medialuna', quantity: 6, unitPrice: 30, unitCost: 10 },
      { recipeId: 'r4', name: 'Sandwich', quantity: 2, unitPrice: 200, unitCost: 80 },
      { recipeId: 'r5', name: 'Jugo', quantity: 1, unitPrice: 80, unitCost: 30 },
    ];

    const sales: Sale[] = [sale({ date: new Date(2026, 5, 15), items, total: 870 })];

    const result = buildDetailedTransactionRows({
      dateFrom,
      dateTo,
      sales,
      supplyExpenses: [],
      fixedCostsByMonth: new Map(),
    });

    expect(result).toHaveLength(1);
    expect(result[0].detail).toBe('Torta x1, Café x3, Medialuna x6, Sandwich x2, Jugo x1');
  });

  it('falls back to expense description when supply expense has no items', () => {
    const dateFrom = new Date(2026, 5, 1);
    const dateTo = new Date(2026, 6, 1);

    const supplyExpenses: SupplyExpense[] = [
      supplyExpense({ date: new Date(2026, 5, 10), items: [], description: 'Factura de luz', total: 4000 }),
    ];

    const result = buildDetailedTransactionRows({
      dateFrom,
      dateTo,
      sales: [],
      supplyExpenses,
      fixedCostsByMonth: new Map(),
    });

    expect(result).toHaveLength(1);
    expect(result[0].detail).toBe('Factura de luz');
  });

  it('falls back to generic text when supply expense has no items and no description', () => {
    const dateFrom = new Date(2026, 5, 1);
    const dateTo = new Date(2026, 6, 1);

    const supplyExpenses: SupplyExpense[] = [
      supplyExpense({ date: new Date(2026, 5, 10), items: [], description: '', total: 3000 }),
    ];

    const result = buildDetailedTransactionRows({
      dateFrom,
      dateTo,
      sales: [],
      supplyExpenses,
      fixedCostsByMonth: new Map(),
    });

    expect(result).toHaveLength(1);
    expect(result[0].detail).toBe('Compra insumos');
  });
});
