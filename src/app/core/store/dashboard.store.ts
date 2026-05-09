import { computed, inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { SalesStore } from './sales.store';
import { FixedCostsStore } from './fixed-costs.store';
import { IngredientsStore } from './ingredients.store';
import { RecipesStore } from './recipes.store';
import { DashboardState } from './state/dashboard.state';
import { getPeriodStart, getPeriodEnd, formatPeriodLabel, toMonthInputValue } from '../utils/dashboard.utils';
import { Period, SelectedDate } from '../models/dashboard';

const now = new Date();

export const DashboardStore = signalStore(
  { providedIn: 'root' },
  withState<DashboardState>({
    selectedPeriod: 'month',
    selectedDate: { year: now.getFullYear(), month: now.getMonth() },
  }),

  withMethods((store) => {
    const salesStore = inject(SalesStore);
    const fixedCostsStore = inject(FixedCostsStore);
    const ingredientsStore = inject(IngredientsStore);
    const recipesStore = inject(RecipesStore);

    const periodSales = computed(() => {
      const start = getPeriodStart(store.selectedPeriod(), store.selectedDate());
      const end = getPeriodEnd(store.selectedPeriod(), store.selectedDate());
      return salesStore.sales().filter((v) => {
        const d = v.date.toDate();
        return d >= start && d < end;
      });
    });

    const selectedMonthKey = computed(() => {
      const { year, month } = store.selectedDate();
      const normalizedMonth = String(month + 1).padStart(2, '0');
      return `${year}-${normalizedMonth}`;
    });

    const monthlySales = computed(() => periodSales().reduce((sum, sale) => sum + sale.total, 0));

    const monthlyExpenses = computed(() => {
      const recipesById = new Map(
        recipesStore.recipes().map((recipe) => [recipe.id, recipe] as const),
      );

      return periodSales().reduce((sum, sale) => {
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

    const monthlyProfit = computed(() => monthlySales() - monthlyExpenses());

    const periodSupplyExpenses = computed(() => {
      const periodStart = getPeriodStart(store.selectedPeriod(), store.selectedDate());
      const periodEnd = getPeriodEnd(store.selectedPeriod(), store.selectedDate());

      return ingredientsStore.supplyExpenses().reduce((sum, expense) => {
        const expenseDate = expense.date?.toDate();
        if (!expenseDate || expenseDate < periodStart || expenseDate >= periodEnd) {
          return sum;
        }
        return sum + expense.total;
      }, 0);
    });

    const periodVariableExpenses = computed(() => monthlyExpenses());

    const periodFixedCosts = computed(() => {
      return fixedCostsStore.totalForMonth(selectedMonthKey());
    });

    // TODO: Para flujo de caja, usar periodSupplyExpenses en una tarjeta separada.
    const totalPeriodExpenses = computed(() => periodVariableExpenses() + periodFixedCosts());

    const netProfit = computed(() => monthlySales() - totalPeriodExpenses());

    const topSellingProduct = computed(() => {
      const vp = periodSales();
      if (!vp.length) return null;

      const recipesById = new Map(
        recipesStore.recipes().map((recipe) => [recipe.id, recipe.name] as const),
      );

      const count: Record<string, { name: string; quantity: number }> = {};
      for (const v of vp) {
        for (const item of v.items) {
          const recipeName = recipesById.get(item.recipeId) ?? 'Receta eliminada';
          if (!count[item.recipeId]) {
            count[item.recipeId] = { name: recipeName, quantity: 0 };
          }
          count[item.recipeId].quantity += item.quantity;
        }
      }
      return Object.values(count).sort((a, b) => b.quantity - a.quantity)[0] ?? null;
    });

    const periodLabel = computed(() => formatPeriodLabel(store.selectedDate()));

    const monthInputValue = computed(() => toMonthInputValue(store.selectedDate()));

    const isCurrentMonth = computed(() => {
      const today = new Date();
      const d = store.selectedDate();
      return d.year === today.getFullYear() && d.month === today.getMonth();
    });

    return {
      monthlySales,
      monthlyExpenses,
      monthlyProfit,
      periodSupplyExpenses,
      periodVariableExpenses,
      periodFixedCosts,
      totalPeriodExpenses,
      netProfit,
      topSellingProduct,
      periodLabel,
      monthInputValue,
      isCurrentMonth,

      setPeriod(period: Period) {
        patchState(store, { selectedPeriod: period });
      },

      setSelectedDate(date: SelectedDate) {
        patchState(store, { selectedDate: date });
      },

      goToPreviousMonth() {
        const { year, month } = store.selectedDate();
        const newMonth = month === 0 ? 11 : month - 1;
        const newYear = month === 0 ? year - 1 : year;
        patchState(store, { selectedDate: { year: newYear, month: newMonth } });
      },

      goToNextMonth() {
        const { year, month } = store.selectedDate();
        const newMonth = month === 11 ? 0 : month + 1;
        const newYear = month === 11 ? year + 1 : year;
        patchState(store, { selectedDate: { year: newYear, month: newMonth } });
      },

      goToCurrentMonth() {
        const today = new Date();
        patchState(store, { selectedDate: { year: today.getFullYear(), month: today.getMonth() } });
      },
    };
  }),
);
