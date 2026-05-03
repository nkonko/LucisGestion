import { computed, inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { FirestoreService } from '../services/firestore.service';
import { FixedCost, FixedCostInput } from '../models/fixed-cost';
import { orderBy } from '@angular/fire/firestore';
import { Timestamp } from 'firebase/firestore';
import { toSignal } from '@angular/core/rxjs-interop';
import { BaseState } from './state/state';

export const FixedCostsStore = signalStore(
  { providedIn: 'root' },
  withState<BaseState>({ loading: false, error: null }),

  withMethods((store) => {
    const fs = inject(FirestoreService);

    const fixedCosts$ = fs.getCollection<FixedCost>('fixedCosts', orderBy('name', 'asc'));
    const allFixedCosts = toSignal(fixedCosts$, { initialValue: [] as FixedCost[] });
    const fixedCosts = computed(() => allFixedCosts().filter((cost) => cost.active));

    return {
      allFixedCosts,
      fixedCosts,

      totalMonthlyFixedCosts: computed(() =>
        fixedCosts().reduce((sum, c) => {
          if (c.frequency === 'monthly') return sum + c.amount;
          return sum;
        }, 0),
      ),

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
        } catch (e: any) {
          patchState(store, { loading: false, error: e.message });
          throw e;
        }
      },

      async updateFixedCost(id: string, changes: Partial<FixedCost>) {
        patchState(store, { loading: true, error: null });
        try {
          await fs.updateDocument('fixedCosts', id, changes as Record<string, any>);
          patchState(store, { loading: false });
        } catch (e: any) {
          patchState(store, { loading: false, error: e.message });
          throw e;
        }
      },

      async deactivateFixedCost(id: string) {
        try {
          return await fs.updateDocument('fixedCosts', id, { active: false, endDate: Timestamp.now() });
        } catch (e: any) {
          patchState(store, { error: e.message });
          throw e;
        }
      },

      async deleteFixedCost(id: string) {
        try {
          return await fs.deleteDocument('fixedCosts', id);
        } catch (e: any) {
          patchState(store, { error: e.message });
          throw e;
        }
      },
    };
  }),
);
