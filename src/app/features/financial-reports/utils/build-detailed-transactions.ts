import type { Sale } from '../../../core/models/sale/sale.model';
import type { SupplyExpense } from '../../../core/models/supply-expense/supply-expense.model';
import type { FixedCostEntry } from '../../../core/models/fixed-cost/fixed-cost-month.model';

export type TransactionSource = 'sale' | 'supply' | 'fixed';

export interface DetailedTransactionRow {
  date: Date;
  detail: string;
  income: number;
  expense: number;
  readonly sourceType: TransactionSource;
}

export interface BuildDetailedTransactionParams {
  dateFrom: Date;
  dateTo: Date;
  sales: readonly Sale[];
  supplyExpenses: readonly SupplyExpense[];
  fixedCostsByMonth: ReadonlyMap<string, readonly FixedCostEntry[]>;
}

const INCOME_STATUSES = new Set(['delivered', 'pending']);

function formatSaleItem(item: { name: string; quantity: number }): string {
  return `${item.name} x${item.quantity}`;
}

function saleToRow(sale: Sale): DetailedTransactionRow {
  const detail = sale.items.map(formatSaleItem).join(', ');
  return {
    date: sale.date.toDate(),
    detail,
    income: sale.total,
    expense: 0,
    sourceType: 'sale' as const,
  };
}

function formatExpenseItem(item: { name: string; quantity: number }): string {
  return `${item.name} ${item.quantity}unid.`;
}

function supplyExpenseToRow(expense: SupplyExpense): DetailedTransactionRow {
  let detail: string;
  if (expense.items.length > 0) {
    detail = expense.items.map(formatExpenseItem).join(', ');
  } else if (expense.description) {
    detail = expense.description;
  } else {
    detail = 'Compra insumos';
  }
  return {
    date: expense.date.toDate(),
    detail,
    income: 0,
    expense: expense.total,
    sourceType: 'supply' as const,
  };
}

function fixedCostToRow(entry: FixedCostEntry, monthKey: string): DetailedTransactionRow {
  const [year, month] = monthKey.split('-');
  return {
    date: new Date(Number(year), Number(month) - 1, 1),
    detail: `${entry.name} — ${entry.category}`,
    income: 0,
    expense: entry.amount,
    sourceType: 'fixed' as const,
  };
}

export function computeIntersectingMonthKeys(dateFrom: Date, dateTo: Date): string[] {
  const keys: string[] = [];
  const current = new Date(dateFrom.getFullYear(), dateFrom.getMonth(), 1);
  while (current < dateTo) {
    const y = current.getFullYear();
    const m = String(current.getMonth() + 1).padStart(2, '0');
    keys.push(`${y}-${m}`);
    current.setMonth(current.getMonth() + 1);
  }
  return keys;
}

export function buildDetailedTransactionRows(
  params: BuildDetailedTransactionParams,
): DetailedTransactionRow[] {
  const { dateFrom, dateTo, sales, supplyExpenses, fixedCostsByMonth } = params;

  const salesRows: DetailedTransactionRow[] = sales
    .filter((s) => INCOME_STATUSES.has(s.status) && s.date.toDate() >= dateFrom && s.date.toDate() < dateTo)
    .map(saleToRow);

  const supplyRows: DetailedTransactionRow[] = supplyExpenses
    .filter((e) => e.date.toDate() >= dateFrom && e.date.toDate() < dateTo)
    .map(supplyExpenseToRow);

  const fixedRows: DetailedTransactionRow[] = [];
  const monthKeys = computeIntersectingMonthKeys(dateFrom, dateTo);
  for (const key of monthKeys) {
    const entries = fixedCostsByMonth.get(key);
    if (entries) {
      for (const entry of entries) {
        fixedRows.push(fixedCostToRow(entry, key));
      }
    }
  }

  const sourcePriority: Record<TransactionSource, number> = {
    sale: 0,
    supply: 1,
    fixed: 2,
  };

  return [...salesRows, ...supplyRows, ...fixedRows].sort((a, b) => {
    const dateDiff = a.date.getTime() - b.date.getTime();
    if (dateDiff !== 0) return dateDiff;
    // Tie-breaker: sales before supply expenses before fixed costs
    return sourcePriority[a.sourceType] - sourcePriority[b.sourceType];
  });
}
