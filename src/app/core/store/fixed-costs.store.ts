import { computed, inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { FirestoreService } from '../services/firestore.service';
import { FixedCost, FixedCostInput } from '../models/fixed-cost';
import { where, orderBy } from '@angular/fire/firestore';
import { toSignal } from '@angular/core/rxjs-interop';
import { BaseState } from './state/state';

export const FixedCostsStore = signalStore(
  { providedIn: 'root' },
  withState<BaseState>({ loading: false, error: null }),

  withMethods((store) => {
    const fs = inject(FirestoreService);

    const fixedCosts$ = fs.getCollection<FixedCost>(
      'fixedCosts',
      where('active', '==', true),
      orderBy('name', 'asc'),
    );
    const fixedCosts = toSignal(fixedCosts$, { initialValue: [] as FixedCost[] });

    return {
      fixedCosts,

      totalMonthlyFixedCosts: computed(() =>
        fixedCosts().reduce((sum, c) => {
          if (c.frequency === 'monthly') return sum + c.amount;
          if (c.frequency === 'weekly') return sum + c.amount * 4;
          return sum;
        }, 0),
      ),

      async createFixedCost(fixedCost: FixedCostInput) {
        patchState(store, { loading: true, error: null });
        try {
          const id = await fs.addDocument<FixedCostInput>('fixedCosts', {
            ...fixedCost,
            active: true,
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

      async deleteFixedCost(id: string) {
        try {
          return await fs.softDelete('fixedCosts', id);
        } catch (e: any) {
          patchState(store, { error: e.message });
          throw e;
        }
      },
    };
  }),
);
