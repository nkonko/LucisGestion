import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DashboardStore } from '../../core/store/dashboard.store';
import { IngredientsStore } from '../../core/store/ingredients.store';
import { SalesStore } from '../../core/store/sales.store';
import { RecipesStore } from '../../core/store/recipes.store';
import { CustomersStore } from '../../core/store/customers.store';
import { ArsPipe } from '../../shared/pipes/ars.pipe';
import { UiIconComponent } from '../../shared/ui/components';
import { NetProfitCardComponent } from './net-profit-card/net-profit-card.component';
import { PeriodNavComponent } from './period-nav/period-nav.component';
import { SelectedDate } from '../../core/models/dashboard';
import { SALE_STATUS_DISPLAY, SaleStatus } from '../../core/models/sale';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, ArsPipe, UiIconComponent, NetProfitCardComponent, PeriodNavComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  readonly store = inject(DashboardStore);
  private ingredientsStore = inject(IngredientsStore);
  private salesStore = inject(SalesStore);
  private recipesStore = inject(RecipesStore);
  private customersStore = inject(CustomersStore);

  lowStock = this.ingredientsStore.lowStock;
  totalRecipes = this.recipesStore.totalRecipes;
  recentSales = this.salesStore.recentSales;
  pendingOrders = this.salesStore.pendingOrdersCount;
  monthlySales = this.store.monthlySales;
  monthlyExpenses = this.store.monthlyExpenses;
  periodVariableExpenses = this.store.periodVariableExpenses;
  periodFixedCosts = this.store.periodFixedCosts;
  totalPeriodExpenses = this.store.totalPeriodExpenses;
  netProfit = this.store.netProfit;
  periodLabel = this.store.periodLabel;
  monthInputValue = this.store.monthInputValue;
  isCurrentMonth = this.store.isCurrentMonth;

  readonly currentMonthMax = (() => {
    const today = new Date();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    return `${today.getFullYear()}-${mm}`;
  })();

  max = computed(() => Math.max(this.monthlySales(), this.totalPeriodExpenses(), 1));

  incomeBarWidth = computed(() => this.calculate(this.monthlySales()));
  ingredientsBarWidth = computed(() => this.calculate(this.monthlyExpenses()));
  fixedCostsBarWidth = computed(() => this.calculate(this.periodFixedCosts()));
  expensesBarWidth = computed(() => this.calculate(this.totalPeriodExpenses()));

  readonly statusDisplay = SALE_STATUS_DISPLAY;
  readonly customersById = computed(
    () => new Map(this.customersStore.customers().map((customer) => [customer.id, customer.name] as const)),
  );

  calculate(value: number) {
    return (value / this.max()) * 100;
  }

  getCustomerName(customerId: string): string {
    if (typeof customerId !== 'string' || !customerId.trim() || !this.customersById().has(customerId)) {
      return 'Cliente eliminado';
    }
    return this.customersById().get(customerId) ?? 'Cliente eliminado';
  }

  getStatusLabel(status: SaleStatus): string {
    return this.statusDisplay[status];
  }

  onMonthInputChange(date: SelectedDate) {
    this.store.setSelectedDate(date);
  }
}

