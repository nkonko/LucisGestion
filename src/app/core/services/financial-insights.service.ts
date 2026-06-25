import { computed, inject, Injectable } from '@angular/core';
import { CostCategory } from '../models/fixed-cost';
import {
  ExpenseAnomaly,
  FinancialInsight,
  FinancialThresholds,
  PriorityCustomer,
  ProductOpportunity,
} from '../models/financial-report';
import { CustomersStore } from '../store/customers.store';
import { DashboardStore } from '../store/dashboard.store';
import { FixedCostsStore } from '../store/fixed-costs.store';
import { IngredientsStore } from '../store/ingredients.store';
import { RecipesStore } from '../store/recipes.store';
import { SalesStore } from '../store/sales.store';
import { CustomerImportance, ImportanceTier } from '../models/financial-report/customer-importance.model';
import { getPeriodEnd, getPeriodStart } from '../utils/dashboard.utils';

const FINANCIAL_THRESHOLDS: FinancialThresholds = {
  highRotationUnits: 20,
  fixedCostIncreaseRatio: 0.2,
  priorityCustomerMinRevenue: 50000,
  priorityCustomerMinPurchases: 3,
};

@Injectable({ providedIn: 'root' })
export class FinancialInsightsService {
  private salesStore = inject(SalesStore);
  private fixedCostsStore = inject(FixedCostsStore);
  private customersStore = inject(CustomersStore);
  private recipesStore = inject(RecipesStore);
  private ingredientsStore = inject(IngredientsStore);
  private dashboardStore = inject(DashboardStore);

  readonly thresholds = FINANCIAL_THRESHOLDS;

  private customersById = computed(
    () => new Map(this.customersStore.customers().map((customer) => [customer.id, customer.name] as const)),
  );

  readonly periodSales = computed(() => {
    const period = this.dashboardStore.selectedPeriod();
    const selectedDate = this.dashboardStore.selectedDate();
    const start = getPeriodStart(period, selectedDate);
    const end = getPeriodEnd(period, selectedDate);

    return this.salesStore.sales().filter((sale) => {
      if (sale.status === 'cancelled' || sale.status === 'draft') return false;
      const saleDate = sale.date.toDate();
      return saleDate >= start && saleDate < end;
    });
  });

  readonly selectedMonthKey = computed(() => {
    const { year, month } = this.dashboardStore.selectedDate();
    return `${year}-${String(month + 1).padStart(2, '0')}`;
  });

  readonly salesForSelectedMonth = computed(() => {
    const monthKey = this.selectedMonthKey();
    return this.salesStore.sales().filter((sale) => {
      if (sale.status === 'cancelled' || sale.status === 'draft') return false;
      const saleDate = sale.date.toDate();
      const saleMonthKey = `${saleDate.getFullYear()}-${String(saleDate.getMonth() + 1).padStart(2, '0')}`;
      return saleMonthKey === monthKey;
    });
  });

  readonly customerImportance = computed<CustomerImportance[]>(() => {
    const grouped = new Map<string, CustomerImportance>();

    for (const sale of this.periodSales()) {
      const key = this.normalizeCustomerId(sale.customerId);
      const current = grouped.get(key);
      const saleDate = sale.date.toDate();

      if (current) {
        current.revenue += sale.total;
        current.ordersCount += 1;
        current.lastPurchaseAt = !current.lastPurchaseAt || saleDate > current.lastPurchaseAt ? saleDate : current.lastPurchaseAt;
        continue;
      }

      grouped.set(key, {
        customerId: sale.customerId,
        customerName: this.getCustomerName(sale.customerId),
        revenue: sale.total,
        ordersCount: 1,
        lastPurchaseAt: saleDate,
        importanceTier: 'bajo',
        retentionHint: '',
      });
    }

    return [...grouped.values()]
      .map((customer) => {
        const importanceTier = this.resolveTier(customer.revenue, customer.ordersCount);
        return {
          ...customer,
          importanceTier,
          retentionHint: this.resolveRetentionHint(importanceTier),
        };
      })
      .sort((a, b) => b.revenue - a.revenue || b.ordersCount - a.ordersCount);
  });

  readonly productOpportunities = computed((): ProductOpportunity[] => {
    const quantitiesByRecipe = new Map<string, number>();
    for (const sale of this.periodSales()) {
      for (const item of sale.items) {
        const current = quantitiesByRecipe.get(item.recipeId) ?? 0;
        quantitiesByRecipe.set(item.recipeId, current + item.quantity);
      }
    }

    const ingredientCount = this.ingredientsStore.ingredients().length;

    const opportunities: ProductOpportunity[] = [];
    for (const [recipeId, soldUnits] of quantitiesByRecipe.entries()) {
      const recipe = this.recipesStore.recipes().find((candidate) => candidate.id === recipeId);
      if (!recipe || soldUnits < this.thresholds.highRotationUnits) continue;

      const estimatedRevenue = soldUnits * recipe.salePrice;
      opportunities.push({
        id: `product-opportunity-${recipeId}`,
        type: 'product-opportunity',
        severity: 'info',
        recipeId,
        recipeName: recipe.name,
        soldUnits,
        estimatedRevenue,
        title: `Alta rotación: ${recipe.name}`,
        description: `Se vendieron ${soldUnits} unidades durante el período seleccionado.`,
        impact: `Ingresos estimados: $${estimatedRevenue.toLocaleString('es-AR')}.`,
        recommendation: `Evalúa aumentar producción o variantes para sostener la demanda con base en ${ingredientCount} ingredientes activos.`,
      });
    }

    return opportunities.sort((a, b) => b.soldUnits - a.soldUnits);
  });

  readonly expenseAnomalies = computed((): ExpenseAnomaly[] => {
    const monthKey = this.selectedMonthKey();
    const [yearText, monthText] = monthKey.split('-');
    const year = Number(yearText);
    const month = Number(monthText);
    const currentEntries = this.fixedCostsStore.entriesForMonth(monthKey);

    const categories: CostCategory[] = ['utilities', 'rent', 'wages', 'taxes', 'other'];

    const anomalies: ExpenseAnomaly[] = [];
    for (const category of categories) {
      const currentAmount = currentEntries
        .filter((entry) => entry.category === category)
        .reduce((sum, entry) => sum + entry.amount, 0);

      const baselineMonths = this.previousMonths(year, month, 3);
      const baselineTotal = baselineMonths.reduce((sum, baselineMonth) => {
        const monthAmount = this.fixedCostsStore
          .entriesForMonth(baselineMonth)
          .filter((entry) => entry.category === category)
          .reduce((categorySum, entry) => categorySum + entry.amount, 0);
        return sum + monthAmount;
      }, 0);

      const baselineAmount = baselineTotal / baselineMonths.length;
      if (baselineAmount <= 0) continue;

      const increaseRatio = (currentAmount - baselineAmount) / baselineAmount;
      if (increaseRatio < this.thresholds.fixedCostIncreaseRatio) continue;

      anomalies.push({
        id: `expense-anomaly-${category}-${monthKey}`,
        type: 'expense-anomaly',
        severity: increaseRatio >= 0.4 ? 'critical' : 'warning',
        category,
        currentAmount,
        baselineAmount,
        increaseRatio,
        title: `Aumento de costos en ${this.costCategoryLabel(category)}`,
        description: `El costo subió ${Math.round(increaseRatio * 100)}% frente al promedio de 3 meses previos.`,
        impact: `Mes actual: $${currentAmount.toLocaleString('es-AR')} vs promedio: $${baselineAmount.toLocaleString('es-AR')}.`,
        recommendation: 'Revisa contratos, consumo y opciones de negociación para esta categoría.',
      });
    }

    return anomalies.sort((a, b) => b.increaseRatio - a.increaseRatio);
  });

  readonly priorityCustomers = computed((): PriorityCustomer[] => {
    const customerSummary = new Map<string, { customerName: string; billedAmount: number; purchasesCount: number }>();

    for (const sale of this.periodSales()) {
      if (!sale.customerId) continue;
      const current = customerSummary.get(sale.customerId) ?? {
        customerName: sale.customerName,
        billedAmount: 0,
        purchasesCount: 0,
      };
      customerSummary.set(sale.customerId, {
        customerName: current.customerName,
        billedAmount: current.billedAmount + sale.total,
        purchasesCount: current.purchasesCount + 1,
      });
    }

    const existingCustomerIds = new Set(
      this.customersStore.customers().map((customer) => customer.id).filter((id): id is string => Boolean(id)),
    );

    return [...customerSummary.entries()]
      .filter(([customerId, summary]) =>
        existingCustomerIds.has(customerId) &&
        summary.billedAmount >= this.thresholds.priorityCustomerMinRevenue &&
        summary.purchasesCount >= this.thresholds.priorityCustomerMinPurchases,
      )
      .map(([customerId, summary]) => ({
        id: `priority-customer-${customerId}`,
        type: 'priority-customer' as const,
        severity: 'info' as const,
        customerId,
        customerName: summary.customerName,
        billedAmount: summary.billedAmount,
        purchasesCount: summary.purchasesCount,
        title: `Cliente prioritario: ${summary.customerName}`,
        description: `Realizó ${summary.purchasesCount} compras durante el período seleccionado.`,
        impact: `Facturación acumulada: $${summary.billedAmount.toLocaleString('es-AR')}.`,
        recommendation: 'Diseña una acción de fidelización personalizada para sostener recurrencia.',
      }))
      .sort((a, b) => b.billedAmount - a.billedAmount);
  });

  readonly insights = computed<FinancialInsight[]>(() => [
    ...this.productOpportunities(),
    ...this.expenseAnomalies(),
    ...this.priorityCustomers(),
  ]);

  private getCustomerName(customerId: string | null): string {
    if (typeof customerId !== 'string' || !customerId.trim() || !this.customersById().has(customerId)) {
      return 'Cliente eliminado';
    }
    return this.customersById().get(customerId) ?? 'Cliente eliminado';
  }

  private normalizeCustomerId(customerId: string | null): string {
    if (typeof customerId !== 'string' || !customerId.trim()) {
      return '__deleted_or_anonymous__';
    }
    return customerId;
  }

  private resolveTier(revenue: number, ordersCount: number): ImportanceTier {
    if (revenue >= 150000 || ordersCount >= 6) {
      return 'alto';
    }

    if (revenue >= 60000 || ordersCount >= 3) {
      return 'medio';
    }

    return 'bajo';
  }

  private resolveRetentionHint(tier: ImportanceTier): string {
    switch (tier) {
      case 'alto':
        return 'Seguimiento personalizado y contacto preventivo.';
      case 'medio':
        return 'Promociones segmentadas para subir frecuencia.';
      default:
        return 'Contacto de reactivación con oferta puntual.';
    }
  }

  private costCategoryLabel(category: CostCategory): string {
    switch (category) {
      case 'utilities':
        return 'servicios';
      case 'rent':
        return 'alquiler';
      case 'wages':
        return 'sueldos';
      case 'taxes':
        return 'impuestos';
      case 'other':
        return 'otros';
    }
  }

  private previousMonths(year: number, month: number, count: number): string[] {
    const out: string[] = [];
    for (let offset = 1; offset <= count; offset += 1) {
      const date = new Date(year, month - 1 - offset, 1);
      out.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
    }
    return out;
  }
}
