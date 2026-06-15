import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { UiIconComponent } from '../../shared/ui/components';
import { MonthNavComponent } from '../../shared/month-nav/month-nav.component';
import { FinancialInsightsService } from '../../core/services/financial-insights.service';
import { DashboardMetricsService } from '../../core/services/dashboard-metrics.service';
import { GeminiRecommendationsService } from '../../core/services/gemini-recommendations.service';
import { BottomSheetService } from '../../core/services/bottom-sheet.service';
import { DashboardStore } from '../../core/store/dashboard.store';
import { SalesStore } from '../../core/store/sales.store';
import { IngredientsStore } from '../../core/store/ingredients.store';
import { Period } from '../../core/models/dashboard';
import { KpiSummaryComponent } from './kpi-summary/kpi-summary.component';
import { InsightsComponent } from './insights/insights.component';
import { TopCustomersComponent } from './top-customers/top-customers.component';
import { TopProductsComponent } from './top-products/top-products.component';
import { LowStockComponent } from './low-stock/low-stock.component';
import { RecommendationsBottomSheetComponent } from './recommendations-bottom-sheet/recommendations-bottom-sheet.component';
import { FinancialReportPdfService } from './services/financial-report-pdf.service';
import { FinancialReportExcelService } from './services/financial-report-excel.service';

@Component({
  selector: 'app-financial-reports',
  imports: [
    UiIconComponent,
    MonthNavComponent,
    KpiSummaryComponent,
    InsightsComponent,
    TopCustomersComponent,
    TopProductsComponent,
    LowStockComponent,
  ],
  templateUrl: './financial-reports.component.html',
  styleUrl: './financial-reports.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FinancialReportsComponent {
  private financialInsights = inject(FinancialInsightsService);
  private metrics = inject(DashboardMetricsService);
  private geminiRecommendations = inject(GeminiRecommendationsService);
  private bottomSheetService = inject(BottomSheetService);
  private dashboardStore = inject(DashboardStore);
  private salesStore = inject(SalesStore);
  private ingredientsStore = inject(IngredientsStore);
  private financialReportPdf = inject(FinancialReportPdfService);
  private financialReportExcel = inject(FinancialReportExcelService);

  readonly isLoadingRecommendations = signal(false);

  readonly periodOptions: { value: Period; label: string }[] = [
    { value: 'today', label: 'Hoy' },
    { value: 'week', label: 'Semana' },
    { value: 'month', label: 'Mes' },
    { value: 'year', label: 'Año' },
  ];

  readonly selectedPeriod = this.dashboardStore.selectedPeriod;
  readonly periodLabel = this.dashboardStore.periodLabel;
  readonly isCurrentPeriod = this.dashboardStore.isCurrentMonth;
  readonly disablePreviousPeriodNav = computed(() => this.selectedPeriod() === 'today');
  readonly previousPeriodLabel = computed(() => {
    switch (this.selectedPeriod()) {
      case 'today':
        return 'Día anterior';
      case 'week':
        return 'Semana anterior';
      case 'year':
        return 'Año anterior';
      case 'month':
        return 'Mes anterior';
    }
  });
  readonly nextPeriodLabel = computed(() => {
    switch (this.selectedPeriod()) {
      case 'today':
        return 'Día siguiente';
      case 'week':
        return 'Semana siguiente';
      case 'year':
        return 'Año siguiente';
      case 'month':
        return 'Mes siguiente';
    }
  });

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

  async exportAsPdf(): Promise<void> {
    await this.financialReportPdf.exportReport({
      periodLabel: this.periodLabel(),
      generatedAt: new Date(),
      monthlySales: this.monthlySales(),
      periodVariableExpenses: this.periodVariableExpenses(),
      periodFixedCosts: this.periodFixedCosts(),
      netProfit: this.netProfit(),
      variableCostRate: this.variableCostRate(),
      fixedCostRate: this.fixedCostRate(),
      profitRate: this.profitRate(),
      productOpportunities: this.productOpportunities(),
      expenseAnomalies: this.expenseAnomalies(),
      priorityCustomers: this.priorityCustomers(),
      topCustomers: this.topCustomerShare(),
      topProducts: this.topProducts(),
      lowStockItems: this.lowStockItems(),
    });
  }

  async exportAsExcel(): Promise<void> {
    await this.financialReportExcel.exportReport({
      periodLabel: this.periodLabel(),
      generatedAt: new Date(),
      monthlySales: this.monthlySales(),
      periodVariableExpenses: this.periodVariableExpenses(),
      periodFixedCosts: this.periodFixedCosts(),
      netProfit: this.netProfit(),
      variableCostRate: this.variableCostRate(),
      fixedCostRate: this.fixedCostRate(),
      profitRate: this.profitRate(),
      productOpportunities: this.productOpportunities(),
      expenseAnomalies: this.expenseAnomalies(),
      priorityCustomers: this.priorityCustomers(),
      topCustomers: this.topCustomerShare(),
      topProducts: this.topProducts(),
      lowStockItems: this.lowStockItems(),
    });
  }

  async openRecommendations(): Promise<void> {
    this.isLoadingRecommendations.set(true);
    try {
      const recommendations = await this.geminiRecommendations.generateRecommendations(
        this.periodLabel(),
      );
      this.bottomSheetService.open(RecommendationsBottomSheetComponent, {
        data: {
          recommendations,
          periodLabel: this.periodLabel(),
        },
        title: 'Recomendaciones',
      });
    } finally {
      this.isLoadingRecommendations.set(false);
    }
  }
}
