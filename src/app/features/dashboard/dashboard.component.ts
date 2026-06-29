import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthStore } from '../../core/store/auth.store';
import { DashboardStore } from '../../core/store/dashboard.store';
import { DashboardMetricsService } from '../../core/services/dashboard-metrics.service';
import { SalesStore } from '../../core/store/sales.store';
import { RecipesStore } from '../../core/store/recipes.store';
import { ArsPipe } from '../../shared/pipes/ars.pipe';
import { RotatingInsightsCardComponent, UiIconComponent } from '../../shared/ui/components';
import { NetProfitCardComponent } from './net-profit-card/net-profit-card.component';
import { MonthNavComponent } from '../../shared/month-nav/month-nav.component';
import { fromMonthInputValue } from '../../core/utils/dashboard.utils';
import { DemoModeService } from '../../core/services/demo-mode.service';
import { DashboardAlertsCardComponent } from './dashboard-alerts-card/dashboard-alerts-card.component';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, ArsPipe, UiIconComponent, NetProfitCardComponent, MonthNavComponent, DashboardAlertsCardComponent, RotatingInsightsCardComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  readonly store = inject(DashboardStore);
  private metrics = inject(DashboardMetricsService);
  private salesStore = inject(SalesStore);
  private recipesStore = inject(RecipesStore);
  private authStore = inject(AuthStore);
  private demoMode = inject(DemoModeService);
  private hour = signal(new Date().getHours());

  readonly basePath = computed(() => this.demoMode.isDemoMode() ? '/demo' : '/app');

  constructor() {
    const destroyRef = inject(DestroyRef);
    const id = setInterval(() => this.hour.set(new Date().getHours()), 60_000);
    destroyRef.onDestroy(() => clearInterval(id));
  }

  totalRecipes = this.recipesStore.totalRecipes;
  recentSales = this.salesStore.recentSales;
  pendingOrders = this.salesStore.pendingOrdersCount;
  topSellingProducts = this.metrics.topSellingProducts;
  bestCustomers = this.metrics.bestCustomers;
  monthlySales = this.metrics.monthlySales;
  monthlyExpenses = this.metrics.monthlyExpenses;
  periodVariableExpenses = this.metrics.periodVariableExpenses;
  periodFixedCosts = this.metrics.periodFixedCosts;
  totalPeriodExpenses = this.metrics.totalPeriodExpenses;
  netProfit = this.metrics.netProfit;
  periodLabel = this.store.periodLabel;
  monthInputValue = this.store.monthInputValue;
  isCurrentMonth = this.store.isCurrentMonth;

  readonly currentMonthMax = (() => {
    const today = new Date();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    return `${today.getFullYear()}-${mm}`;
  })();

  greetingName = computed(() => {
    const user = this.authStore.appUser();
    if (user?.displayName) return user.displayName;
    if (user?.email) return user.email.split('@')[0];
    return null;
  });

  greeting = computed(() => {
    const h = this.hour();
    if (h < 6) return 'El que madruga Dios le ayuda';
    if (h < 12) return 'Buen día';
    if (h < 20) return 'Buenas tardes';
    return 'Buenas noches';
  });

  max = computed(() => Math.max(this.monthlySales(), this.totalPeriodExpenses(), 1));

  incomeBarWidth = computed(() => this.calculate(this.monthlySales()));
  ingredientsBarWidth = computed(() => this.calculate(this.monthlyExpenses()));
  fixedCostsBarWidth = computed(() => this.calculate(this.periodFixedCosts()));
  expensesBarWidth = computed(() => this.calculate(this.totalPeriodExpenses()));

  calculate(value: number) {
    return (value / this.max()) * 100;
  }

  onMonthInputChange(event: Event): void {
    const monthText = (event.target as HTMLInputElement).value.trim();
    if (!/^\d{4}-\d{2}$/.test(monthText)) return;
    const selectedDate = fromMonthInputValue(monthText);
    if (selectedDate) this.store.setSelectedDate(selectedDate);
  }
}

