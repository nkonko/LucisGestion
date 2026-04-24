import { computed, inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { SalesStore } from './sales.store';
import { FixedCostsStore } from './fixed-costs.store';
import { DashboardState } from './state/dashboard.state';
import { getPeriodStart } from '../utils/dashboard.utils';
import { Period } from '../models/dashboard';

export const DashboardStore = signalStore(
  { providedIn: 'root' },
  withState<DashboardState>({ selectedPeriod: 'month' }),

  withMethods((store) => {
    const salesStore = inject(SalesStore);
    const fixedCostsStore = inject(FixedCostsStore);

    const periodSales = computed(() => {
      const start = getPeriodStart(store.selectedPeriod());
      return salesStore.sales().filter((v) => v.date?.toDate() >= start);
    });

    const monthlySales = computed(() => periodSales().reduce((sum, v) => sum + v.total, 0));

    const monthlyExpenses = computed(() => periodSales().reduce((sum, v) => sum + v.totalCost, 0));

    const monthlyProfit = computed(() => periodSales().reduce((sum, v) => sum + v.profit, 0));

    const periodFixedCosts = computed(() => fixedCostsStore.totalMonthlyFixedCosts());

    const totalPeriodExpenses = computed(() => monthlyExpenses() + periodFixedCosts());

    const netProfit = computed(() => monthlyProfit() - periodFixedCosts());

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

    return {
      monthlySales,
      monthlyExpenses,
      monthlyProfit,
      periodFixedCosts,
      totalPeriodExpenses,
      netProfit,
      topSellingProduct,

      setPeriod(period: Period) {
        patchState(store, { selectedPeriod: period });
      },
    };
  }),
);
