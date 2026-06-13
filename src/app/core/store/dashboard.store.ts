import { computed } from '@angular/core';
import { signalStore, withState, withComputed, withMethods, patchState } from '@ngrx/signals';
import { DashboardState } from './state/dashboard.state';
import { formatPeriodLabel, toMonthInputValue } from '../utils/dashboard.utils';
import { Period, SelectedDate } from '../models/dashboard';

const now = new Date();

export const DashboardStore = signalStore(
  { providedIn: 'root' },
  withState<DashboardState>({
    selectedPeriod: 'month',
    selectedDate: { year: now.getFullYear(), month: now.getMonth() },
  }),

  withComputed((store) => ({
    periodLabel: computed(() => formatPeriodLabel(store.selectedDate(), store.selectedPeriod())),
    monthInputValue: computed(() => toMonthInputValue(store.selectedDate())),
    isCurrentMonth: computed(() => {
      const today = new Date();
      const selected = store.selectedDate();
      const period = store.selectedPeriod();
      if (period === 'today' || period === 'week') return true;
      if (period === 'year') return selected.year === today.getFullYear();
      return selected.year === today.getFullYear() && selected.month === today.getMonth();
    }),
  })),

  withMethods((store) => ({
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
  })),
);
