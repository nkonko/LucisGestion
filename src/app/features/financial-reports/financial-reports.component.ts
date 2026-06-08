import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { PercentPipe } from '@angular/common';
import { ArsPipe } from '../../shared/pipes/ars.pipe';
import { UiIconComponent, KpiCardComponent, InsightCardComponent } from '../../shared/ui/components';
import { MonthNavComponent } from '../../shared/month-nav/month-nav.component';
import { FinancialInsightsService } from '../../core/services/financial-insights.service';
import { DashboardMetricsService } from '../../core/services/dashboard-metrics.service';
import { DashboardStore } from '../../core/store/dashboard.store';
import { SalesStore } from '../../core/store/sales.store';
import { IngredientsStore } from '../../core/store/ingredients.store';
import { Period } from '../../core/models/dashboard';

@Component({
  selector: 'app-financial-reports',
  imports: [ArsPipe, PercentPipe, UiIconComponent, MonthNavComponent, KpiCardComponent, InsightCardComponent],
  templateUrl: './financial-reports.component.html',
  styleUrl: './financial-reports.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FinancialReportsComponent {
  private financialInsights = inject(FinancialInsightsService);
  private metrics = inject(DashboardMetricsService);
  private dashboardStore = inject(DashboardStore);
  private salesStore = inject(SalesStore);
  private ingredientsStore = inject(IngredientsStore);

  readonly periodOptions: { value: Period; label: string }[] = [
    { value: 'today', label: 'Hoy' },
    { value: 'week', label: 'Semana' },
    { value: 'month', label: 'Mes' },
    { value: 'year', label: 'Año' },
  ];

  readonly selectedPeriod = this.dashboardStore.selectedPeriod;
  readonly periodLabel = this.dashboardStore.periodLabel;
  readonly isCurrentPeriod = this.dashboardStore.isCurrentMonth;

  readonly monthlySales = this.metrics.monthlySales;
  readonly monthlyExpenses = this.metrics.monthlyExpenses;
  readonly periodFixedCosts = this.metrics.periodFixedCosts;
  readonly periodVariableExpenses = this.metrics.periodVariableExpenses;
  readonly netProfit = this.metrics.netProfit;

  readonly profitRate = computed(() => {
    const sales = this.monthlySales();
    if (sales === 0) return 0;
    return Math.round((this.netProfit() / sales) * 100);
  });

  readonly expenseRate = computed(() => {
    const sales = this.monthlySales();
    if (sales === 0) return 0;
    return Math.round(((this.monthlyExpenses() + this.periodFixedCosts()) / sales) * 100);
  });

  readonly fixedCostRate = computed(() => {
    const sales = this.monthlySales();
    if (sales === 0) return 0;
    return Math.round((this.periodFixedCosts() / sales) * 100);
  });

  readonly variableCostRate = computed(() => {
    const sales = this.monthlySales();
    if (sales === 0) return 0;
    return Math.round((this.periodVariableExpenses() / sales) * 100);
  });

  readonly isProfitable = computed(() => this.netProfit() >= 0);

  readonly customersToCare = this.financialInsights.customerImportance;
  readonly productOpportunities = this.financialInsights.productOpportunities;
  readonly expenseAnomalies = this.financialInsights.expenseAnomalies;
  readonly priorityCustomers = this.financialInsights.priorityCustomers;

  readonly hasProductOpportunities = computed(() => this.productOpportunities().length > 0);
  readonly hasExpenseAnomalies = computed(() => this.expenseAnomalies().length > 0);
  readonly hasPriorityCustomers = computed(() => this.priorityCustomers().length > 0);

  readonly hasInsights = computed(
    () => this.hasProductOpportunities() || this.hasExpenseAnomalies() || this.hasPriorityCustomers(),
  );

  readonly topProducts = computed(() => {
    const sales = this.financialInsights.periodSales();
    const productMap = new Map<string, { name: string; quantity: number; revenue: number; cost: number }>();

    for (const sale of sales) {
      if (sale.status === 'cancelled') continue;
      for (const item of sale.items) {
        const entry = productMap.get(item.recipeId) ?? { name: item.name, quantity: 0, revenue: 0, cost: 0 };
        entry.quantity += item.quantity;
        entry.revenue += item.unitPrice * item.quantity;
        entry.cost += item.unitCost * item.quantity;
        productMap.set(item.recipeId, entry);
      }
    }

    return [...productMap.values()]
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
      .map(p => ({
        ...p,
        margin: p.revenue > 0 ? Math.round(((p.revenue - p.cost) / p.revenue) * 100) : 0,
      }));
  });

  readonly hasTopProducts = computed(() => this.topProducts().length > 0);

  readonly topCustomerShare = computed(() => {
    const customers = this.customersToCare();
    if (!customers.length) return [];
    const totalRevenue = customers.reduce((sum, c) => sum + c.revenue, 0);
    return customers.slice(0, 5).map(c => ({
      name: c.customerName,
      revenue: c.revenue,
      share: totalRevenue > 0 ? Math.round((c.revenue / totalRevenue) * 100) : 0,
      ordersCount: c.ordersCount,
    }));
  });

  readonly hasCustomerShare = computed(() => this.topCustomerShare().length > 0);

  readonly lowStockItems = this.ingredientsStore.lowStock;
  readonly hasLowStock = computed(() => this.lowStockItems().length > 0);

  readonly hasSalesData = computed(() => this.monthlySales() > 0);
  readonly hasAnySales = computed(() => this.salesStore.sales().length > 0);

  goToPreviousMonth(): void {
    this.dashboardStore.goToPreviousMonth();
  }

  goToNextMonth(): void {
    this.dashboardStore.goToNextMonth();
  }

  goToCurrentMonth(): void {
    this.dashboardStore.goToCurrentMonth();
  }

  setPeriod(period: Period): void {
    this.dashboardStore.setPeriod(period);
  }
}
