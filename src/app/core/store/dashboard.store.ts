import { computed } from '@angular/core';
import { signalStore, withState, withComputed, withMethods, patchState } from '@ngrx/signals';
import { DashboardState } from './state/dashboard.state';
import { formatPeriodLabel, getPeriodStart, toMonthInputValue } from '../utils/dashboard.utils';
import { Period, SelectedDate } from '../models/dashboard';

const now = new Date();

function dateToSelectedDate(date: Date): SelectedDate {
  return {
    year: date.getFullYear(),
    month: date.getMonth(),
    day: date.getDate(),
  };
}

function selectedDateToDate(selectedDate: SelectedDate): Date {
  return new Date(selectedDate.year, selectedDate.month, selectedDate.day ?? 1);
}

export const DashboardStore = signalStore(
  { providedIn: 'root' },
  withState<DashboardState>({
    selectedPeriod: 'month',
    selectedDate: { year: now.getFullYear(), month: now.getMonth(), day: now.getDate() },
    dateFrom: null,
    dateTo: null,
  }),

  withComputed((store) => ({
    periodLabel: computed(() => formatPeriodLabel(store.selectedDate(), store.selectedPeriod())),
    monthInputValue: computed(() => toMonthInputValue(store.selectedDate())),
    isCurrentMonth: computed(() => {
      const selected = store.selectedDate();
      const period = store.selectedPeriod();
      const today = dateToSelectedDate(new Date());
      const selectedStart = getPeriodStart(period, selected).getTime();
      const currentStart = getPeriodStart(period, today).getTime();
      return selectedStart === currentStart;
    }),
  })),

  withMethods((store) => ({
    setPeriod(period: Period) {
      patchState(store, { selectedPeriod: period, selectedDate: dateToSelectedDate(new Date()), dateFrom: null, dateTo: null });
    },

    setDateRange(from: Date, to: Date) {
      patchState(store, { dateFrom: from.getTime(), dateTo: to.getTime() });
    },

    clearDateRange() {
      patchState(store, { dateFrom: null, dateTo: null });
    },

    setSelectedDate(date: SelectedDate) {
      patchState(store, { selectedDate: date });
    },

    goToPreviousMonth() {
      const period = store.selectedPeriod();
      if (period === 'today') {
        return;
      }

      const selected = selectedDateToDate(store.selectedDate());
      switch (period) {
        case 'week':
          selected.setDate(selected.getDate() - 7);
          break;
        case 'year':
          selected.setFullYear(selected.getFullYear() - 1);
          break;
        case 'month':
          selected.setMonth(selected.getMonth() - 1);
          break;
      }

      patchState(store, { selectedDate: dateToSelectedDate(selected) });
    },

    goToNextMonth() {
      if (store.isCurrentMonth()) {
        return;
      }

      const period = store.selectedPeriod();
      const selected = selectedDateToDate(store.selectedDate());
      switch (period) {
        case 'week':
          selected.setDate(selected.getDate() + 7);
          break;
        case 'year':
          selected.setFullYear(selected.getFullYear() + 1);
          break;
        case 'month':
          selected.setMonth(selected.getMonth() + 1);
          break;
      }

      patchState(store, { selectedDate: dateToSelectedDate(selected) });
    },

    goToCurrentMonth() {
      patchState(store, { selectedDate: dateToSelectedDate(new Date()) });
    },
  })),
);
