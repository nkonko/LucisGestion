import { Injectable, computed, inject } from '@angular/core';
import { DashboardStore } from '../store/dashboard.store';
import { SalesStore } from '../store/sales.store';
import { FixedCostsStore } from '../store/fixed-costs.store';
import { IngredientsStore } from '../store/ingredients.store';
import { RecipesStore } from '../store/recipes.store';
import { getPeriodStart, getPeriodEnd } from '../utils/dashboard.utils';

@Injectable({ providedIn: 'root' })
export class DashboardMetricsService {
  private dashboardStore = inject(DashboardStore);
  private salesStore = inject(SalesStore);
  private fixedCostsStore = inject(FixedCostsStore);
  private ingredientsStore = inject(IngredientsStore);
  private recipesStore = inject(RecipesStore);

  private periodRange = computed(() => {
    const period = this.dashboardStore.selectedPeriod();
    const date = this.dashboardStore.selectedDate();
    return {
      start: getPeriodStart(period, date),
      end: getPeriodEnd(period, date),
    };
  });

  private periodSales = computed(() => {
    const { start, end } = this.periodRange();
    return this.salesStore.sales().filter((sale) => {
      if (sale.status === 'draft') return false;
      const saleDate = sale.date.toDate();
      return saleDate >= start && saleDate < end;
    });
  });

  private selectedMonthKey = computed(() => {
    const { year, month } = this.dashboardStore.selectedDate();
    const normalizedMonth = String(month + 1).padStart(2, '0');
    return `${year}-${normalizedMonth}`;
  });

  readonly monthlySales = computed(() =>
    this.periodSales().reduce((sum, sale) => sum + sale.total, 0),
  );

  readonly monthlyExpenses = computed(() => {
    const recipesById = new Map(
      this.recipesStore.recipes().map((recipe) => [recipe.id, recipe] as const),
    );

    return this.periodSales().reduce((sum, sale) => {
      const saleCost = sale.items.reduce((itemSum, item) => {
        const recipe = recipesById.get(item.recipeId);
        if (!recipe) {
          return itemSum;
        }

        const yieldAmount = recipe.yield > 0 ? recipe.yield : 1;
        const unitCost = recipe.calculatedCost / yieldAmount;
        return itemSum + unitCost * item.quantity;
      }, 0);

      return sum + saleCost;
    }, 0);
  });

  readonly monthlyProfit = computed(() => this.monthlySales() - this.monthlyExpenses());

  readonly periodSupplyExpenses = computed(() => {
    const { start, end } = this.periodRange();

    return this.ingredientsStore.supplyExpenses().reduce((sum, expense) => {
      const expenseDate = expense.date?.toDate();
      if (!expenseDate || expenseDate < start || expenseDate >= end) {
        return sum;
      }
      return sum + expense.total;
    }, 0);
  });

  readonly periodVariableExpenses = computed(() => this.monthlyExpenses());

  readonly periodFixedCosts = computed(() => {
    const period = this.dashboardStore.selectedPeriod();
    if (period === 'year') {
      const { year } = this.dashboardStore.selectedDate();
      let total = 0;
      for (let m = 0; m < 12; m++) {
        const key = `${year}-${String(m + 1).padStart(2, '0')}`;
        total += this.fixedCostsStore.totalForMonth(key);
      }
      return total;
    }
    return this.fixedCostsStore.totalForMonth(this.selectedMonthKey());
  });

  readonly totalPeriodExpenses = computed(
    () => this.periodVariableExpenses() + this.periodFixedCosts(),
  );

  readonly netProfit = computed(() => this.monthlySales() - this.totalPeriodExpenses());

  readonly topSellingProduct = computed(() => {
    const sales = this.periodSales();
    if (!sales.length) return null;

    const recipeNamesById = new Map(
      this.recipesStore.recipes().map((recipe) => [recipe.id, recipe.name] as const),
    );

    const quantitiesByRecipe = new Map<string, { name: string; quantity: number }>();
    for (const sale of sales) {
      for (const item of sale.items) {
        const recipeName = recipeNamesById.get(item.recipeId) ?? 'Receta eliminada';
        const current = quantitiesByRecipe.get(item.recipeId);
        if (current) {
          current.quantity += item.quantity;
        } else {
          quantitiesByRecipe.set(item.recipeId, { name: recipeName, quantity: item.quantity });
        }
      }
    }

    return [...quantitiesByRecipe.values()].sort((a, b) => b.quantity - a.quantity)[0] ?? null;
  });
}
