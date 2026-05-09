import { computed, inject } from '@angular/core';
import { signalStore, withState, withComputed, withMethods, patchState } from '@ngrx/signals';
import { FirestoreService } from '../services/firestore.service';
import { FixedCost, FixedCostInput } from '../models/fixed-cost';
import { orderBy } from '@angular/fire/firestore';
import { Timestamp } from 'firebase/firestore';
import { toSignal } from '@angular/core/rxjs-interop';
import { BaseState } from './state/state';
import { getErrorMessage } from '../utils/error.utils';

export const FixedCostsStore = signalStore(
  { providedIn: 'root' },
  withState<BaseState>({ loading: false, error: null }),

  withComputed(() => {
    const fs = inject(FirestoreService);
    const fixedCosts$ = fs.getCollection<FixedCost>('fixedCosts', orderBy('name', 'asc'));
    const allFixedCosts = toSignal(fixedCosts$, { initialValue: [] as FixedCost[] });
    const fixedCosts = computed(() => allFixedCosts().filter((cost) => cost.active));

    return {
      allFixedCosts,
      fixedCosts,
      totalMonthlyFixedCosts: computed(() =>
        fixedCosts().reduce((sum, cost) => {
          if (cost.frequency === 'monthly') return sum + cost.amount;
          return sum;
        }, 0),
      ),
    };
  }),

  withMethods((store) => {
    const fs = inject(FirestoreService);

    return {
      totalForMonth(monthKey: string): number {
        const [year, monthNum] = monthKey.split('-').map(Number);
        const monthStart = new Date(year, monthNum - 1, 1);
        const monthEnd = new Date(year, monthNum, 1);
        return store
          .allFixedCosts()
          .filter((cost) => {
            const start = cost.startDate?.toDate() ?? new Date(0);
            const end = cost.endDate ? cost.endDate.toDate() : null;
            return start < monthEnd && (end === null || end > monthStart);
          })
          .reduce((sum, cost) => sum + cost.amount, 0);
      },

      async createFixedCost(fixedCost: FixedCostInput) {
        patchState(store, { loading: true, error: null });
        try {
          const id = await fs.addDocument<FixedCostInput>('fixedCosts', {
            ...fixedCost,
            active: true,
            startDate: Timestamp.now(),
            endDate: null,
          });
          patchState(store, { loading: false });
          return id;
        } catch (error: unknown) {
          patchState(store, { loading: false, error: getErrorMessage(error) });
          throw error;
        }
      },

      async updateFixedCost(id: string, changes: Partial<FixedCost>) {
        patchState(store, { loading: true, error: null });
        try {
          await fs.updateDocument('fixedCosts', id, changes as Record<string, unknown>);
          patchState(store, { loading: false });
        } catch (error: unknown) {
          patchState(store, { loading: false, error: getErrorMessage(error) });
          throw error;
        }
      },

      async deactivateFixedCost(id: string) {
        try {
          return await fs.updateDocument('fixedCosts', id, { active: false, endDate: Timestamp.now() });
        } catch (error: unknown) {
          patchState(store, { error: getErrorMessage(error) });
          throw error;
        }
      },

      async deleteFixedCost(id: string) {
        try {
          return await fs.deleteDocument('fixedCosts', id);
        } catch (error: unknown) {
          patchState(store, { error: getErrorMessage(error) });
          throw error;
        }
      },
    };
  }),
);
