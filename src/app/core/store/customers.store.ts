import { inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { FirestoreService } from '../services/firestore.service';
import { Customer, CustomerInput } from '../models/customer';
import { orderBy } from '@angular/fire/firestore';
import { toSignal } from '@angular/core/rxjs-interop';
import { BaseState } from './state/state';
import { getErrorMessage } from '../utils/error.utils';

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
        } catch (e: unknown) {
          patchState(store, { error: getErrorMessage(e) });
          throw e;
        }
      },

      async updateCustomer(id: string, changes: Partial<Customer>) {
        try {
          return await fs.updateDocument('customers', id, changes);
        } catch (e: unknown) {
          patchState(store, { error: getErrorMessage(e) });
          throw e;
        }
      },

      async deleteCustomer(id: string) {
        try {
          await fs.clearCustomerReferencesInSales(id);
          return await fs.deleteDocument('customers', id);
        } catch (e: unknown) {
          patchState(store, { error: getErrorMessage(e) });
          throw e;
        }
      },
    };
  }),
);
