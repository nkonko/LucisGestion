import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DashboardStore } from '../../core/store/dashboard.store';
import { IngredientsStore } from '../../core/store/ingredients.store';
import { SalesStore } from '../../core/store/sales.store';
import { RecipesStore } from '../../core/store/recipes.store';
import { ArsPipe } from '../../shared/pipes/ars.pipe';
import { UiIconComponent } from '../../shared/ui/components';
import { NetProfitCardComponent } from './net-profit-card/net-profit-card.component';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, ArsPipe, UiIconComponent, NetProfitCardComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  readonly store = inject(DashboardStore);
  private ingredientsStore = inject(IngredientsStore);
  private salesStore = inject(SalesStore);
  private recipesStore = inject(RecipesStore);

  lowStock = this.ingredientsStore.lowStock;
  totalRecipes = this.recipesStore.totalRecipes;
  recentSales = this.salesStore.recentSales;
  pendingOrders = this.salesStore.pendingOrdersCount;
  monthlySales = this.store.monthlySales;
  monthlyExpenses = this.store.monthlyExpenses;
  periodFixedCosts = this.store.periodFixedCosts;
  totalPeriodExpenses = this.store.totalPeriodExpenses;
  netProfit = this.store.netProfit;
  max = computed(() => Math.max(this.monthlySales(), this.totalPeriodExpenses(), 1));

  incomeBarWidth = computed(() => {
    return this.calculate((this.monthlySales()));
  });

  ingredientsBarWidth = computed(() => {
    return this.calculate((this.monthlyExpenses()));
  });

  fixedCostsBarWidth = computed(() => {
    return this.calculate((this.periodFixedCosts()));
  });

  expensesBarWidth = computed(() => {
    return this.calculate(this.totalPeriodExpenses());
  });

  calculate(value: number) {
    return (value / this.max()) * 100;
  }
}
