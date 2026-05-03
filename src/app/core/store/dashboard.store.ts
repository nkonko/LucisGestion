import { computed, inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { SalesStore } from './sales.store';
import { FixedCostsStore } from './fixed-costs.store';
import { IngredientsStore } from './ingredients.store';
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

    const periodSales = computed(() => {
      const start = getPeriodStart(store.selectedPeriod(), store.selectedDate());
      const end = getPeriodEnd(store.selectedPeriod(), store.selectedDate());
      return salesStore.sales().filter((v) => {
        const d = v.date?.toDate();
        return d !== undefined && d >= start && d < end;
      });
    });

    const monthlySales = computed(() => periodSales().reduce((sum, v) => sum + v.total, 0));

    const monthlyExpenses = computed(() => periodSales().reduce((sum, v) => sum + v.totalCost, 0));

    const monthlyProfit = computed(() => periodSales().reduce((sum, v) => sum + v.profit, 0));

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
      const periodStart = getPeriodStart(store.selectedPeriod(), store.selectedDate());
      const periodEnd = getPeriodEnd(store.selectedPeriod(), store.selectedDate());

      return fixedCostsStore.allFixedCosts().reduce((sum, cost) => {
        const startDate = cost.startDate?.toDate() ?? new Date(1970, 0, 1);
        const endDate = cost.endDate?.toDate() ?? null;
        const isActiveInPeriod = startDate < periodEnd && (endDate === null || endDate >= periodStart);

        if (!isActiveInPeriod) return sum;
        if (cost.frequency === 'monthly') return sum + cost.amount;
        return sum;
      }, 0);
    });

      const totalPeriodExpenses = computed(() => periodVariableExpenses() + periodFixedCosts() + periodSupplyExpenses());

    const netProfit = computed(() => monthlySales() - totalPeriodExpenses());

    const topSellingProduct = computed(() => {
      const vp = periodSales();
      if (!vp.length) return null;
      const count: Record<string, { name: string; quantity: number }> = {};
      for (const v of vp) {
        for (const item of v.items) {
          if (!count[item.recipeId]) {
            count[item.recipeId] = { name: item.name, quantity: 0 };
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
