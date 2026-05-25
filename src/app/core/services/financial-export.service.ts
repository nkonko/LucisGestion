import { Injectable, inject } from '@angular/core';
import { DashboardMetricsService } from './dashboard-metrics.service';
import { SalesStore } from '../store/sales.store';
import { RecipesStore } from '../store/recipes.store';
import { FixedCostsStore } from '../store/fixed-costs.store';
import { CustomersStore } from '../store/customers.store';
import type { FinancialExportRequest } from '../models/financial-report';

@Injectable({ providedIn: 'root' })
export class FinancialExportService {
  private metrics = inject(DashboardMetricsService);
  private salesStore = inject(SalesStore);
  private recipesStore = inject(RecipesStore);
  private fixedCostsStore = inject(FixedCostsStore);
  private customersStore = inject(CustomersStore);

  async exportExcel(request: FinancialExportRequest): Promise<void> {
    const { utils, writeFileXLSX } = await import('xlsx');
    const workbook = utils.book_new();

    for (const dataset of request.datasets) {
      const rows = this.normalizeDataset(dataset, request.period);
      if (rows.length === 0) {
        continue;
      }
      const worksheet = utils.json_to_sheet(rows);
      utils.book_append_sheet(workbook, worksheet, this.getSheetName(dataset));
    }

    if (workbook.SheetNames.length === 0) {
      return;
    }

    const year = request.period.getFullYear();
    const month = String(request.period.getMonth() + 1).padStart(2, '0');
    writeFileXLSX(workbook, `reportes-financieros-${year}-${month}.xlsx`);
  }

  private normalizeDataset(dataset: FinancialExportRequest['datasets'][number], period: Date): Record<string, string | number>[] {
    const salesInPeriod = this.salesStore.sales().filter((sale) => {
      const saleDate = sale.date.toDate();
      return saleDate.getFullYear() === period.getFullYear() && saleDate.getMonth() === period.getMonth();
    });
    switch (dataset) {
      case 'insights':
        return [
          { Métrica: 'Ventas del período', Valor: this.metrics.monthlySales() },
          { Métrica: 'Costo de ventas', Valor: this.metrics.monthlyExpenses() },
          { Métrica: 'Costos fijos', Valor: this.metrics.periodFixedCosts() },
          { Métrica: 'Gastos totales', Valor: this.metrics.totalPeriodExpenses() },
          { Métrica: 'Ganancia neta', Valor: this.metrics.netProfit() },
        ];
      case 'salesByProduct': {
        const recipeNames = new Map(this.recipesStore.recipes().map((recipe) => [recipe.id, recipe.name] as const));
        const soldByRecipe = new Map<string, { producto: string; unidades: number; total: number }>();

        for (const sale of salesInPeriod) {
          for (const item of sale.items) {
            const current = soldByRecipe.get(item.recipeId);
            const name = recipeNames.get(item.recipeId) ?? 'Receta eliminada';
            const subtotal = item.unitPrice * item.quantity;
            if (current) {
              current.unidades += item.quantity;
              current.total += subtotal;
            } else {
              soldByRecipe.set(item.recipeId, { producto: name, unidades: item.quantity, total: subtotal });
            }
          }
        }

        return [...soldByRecipe.values()]
          .sort((a, b) => b.unidades - a.unidades)
          .map((item) => ({ Producto: item.producto, 'Unidades vendidas': item.unidades, 'Total vendido': item.total }));
      }
      case 'expensesByCategory': {
        const monthKey = `${period.getFullYear()}-${String(period.getMonth() + 1).padStart(2, '0')}`;
        const byCategory = new Map<string, number>();

        for (const entry of this.fixedCostsStore.entriesForMonth(monthKey)) {
          byCategory.set(entry.category, (byCategory.get(entry.category) ?? 0) + entry.amount);
        }

        return [...byCategory.entries()].map(([category, amount]) => ({ Categoría: category, Monto: amount }));
      }
      case 'keyCustomers': {
        const customerNames = new Map(this.customersStore.customers().map((customer) => [customer.id, customer.name] as const));
        const customers = new Map<string, { cliente: string; pedidos: number; total: number }>();

        for (const sale of salesInPeriod) {
          if (!sale.customerId) {
            continue;
          }
          const current = customers.get(sale.customerId);
          const customerName = customerNames.get(sale.customerId) ?? 'Cliente eliminado';
          if (current) {
            current.pedidos += 1;
            current.total += sale.total;
          } else {
            customers.set(sale.customerId, { cliente: customerName, pedidos: 1, total: sale.total });
          }
        }

        return [...customers.values()]
          .sort((a, b) => b.total - a.total)
          .map((item) => ({ Cliente: item.cliente, Pedidos: item.pedidos, Facturación: item.total }));
      }
    }
  }

  private getSheetName(dataset: FinancialExportRequest['datasets'][number]): string {
    switch (dataset) {
      case 'insights':
        return 'Insights';
      case 'salesByProduct':
        return 'Ventas x producto';
      case 'expensesByCategory':
        return 'Gastos x categoría';
      case 'keyCustomers':
        return 'Clientes clave';
    }
  }
}
