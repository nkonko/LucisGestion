import { inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { FirestoreService } from '../services/firestore.service';
import { Customer, CustomerInput } from '../models/customer';
import { orderBy } from '@angular/fire/firestore';
import { toSignal } from '@angular/core/rxjs-interop';
import { BaseState } from './state/state';

export const CustomersStore = signalStore(
  { providedIn: 'root' },
  withState<BaseState>({ loading: false, error: null }),

  withMethods((store) => {
    const fs = inject(FirestoreService);

    const customers$ = fs.getCollection<Customer>('customers', orderBy('name', 'asc'));
    const customers = toSignal(customers$, { initialValue: [] as Customer[] });

    return {
      customers,

      async createCustomer(customer: CustomerInput) {
        try {
          return await fs.addDocument('customers', customer);
        } catch (e: any) {
          patchState(store, { error: e.message });
          throw e;
        }
      },

      async updateCustomer(id: string, changes: Partial<Customer>) {
        try {
          return await fs.updateDocument('customers', id, changes);
        } catch (e: any) {
          patchState(store, { error: e.message });
          throw e;
        }
      },

      async deleteCustomer(id: string) {
        try {
          return await fs.updateDocument('customers', id, { name: '[eliminado]' });
        } catch (e: any) {
          patchState(store, { error: e.message });
          throw e;
        }
      },
    };
  }),
);
