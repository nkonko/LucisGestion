import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DashboardStore } from '../../core/store/dashboard.store';
import { IngredientsStore } from '../../core/store/ingredients.store';
import { SalesStore } from '../../core/store/sales.store';
import { RecipesStore } from '../../core/store/recipes.store';
import { ArsPipe } from '../../shared/pipes/ars.pipe';
import { UiIconComponent } from '../../shared/ui/components';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, ArsPipe, UiIconComponent],
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

  incomeBarWidth = computed(() => {
    const max = Math.max(this.monthlySales(), this.totalPeriodExpenses(), 1);
    return (this.monthlySales() / max) * 100;
  });

  ingredientsBarWidth = computed(() => {
    const max = Math.max(this.monthlySales(), this.totalPeriodExpenses(), 1);
    return (this.monthlyExpenses() / max) * 100;
  });

  fixedCostsBarWidth = computed(() => {
    const max = Math.max(this.monthlySales(), this.totalPeriodExpenses(), 1);
    return (this.periodFixedCosts() / max) * 100;
  });

  expensesBarWidth = computed(() => {
    const max = Math.max(this.monthlySales(), this.totalPeriodExpenses(), 1);
    return (this.totalPeriodExpenses() / max) * 100;
  });
}
