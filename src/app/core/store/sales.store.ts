import { computed, inject } from '@angular/core';
import { signalStore, withState, withComputed, withMethods, patchState } from '@ngrx/signals';
import { FirestoreService } from '../services/firestore.service';
import { Sale, SaleInput } from '../models/sale';
import { orderBy } from '@angular/fire/firestore';
import { toSignal } from '@angular/core/rxjs-interop';
import { SalesService } from '../services/sales.service';
import { BaseState } from './state/state';
import { getErrorMessage } from '../utils/error.utils';

export const SalesStore = signalStore(
  { providedIn: 'root' },
  withState<BaseState>({ loading: false, error: null }),

  withComputed(() => {
    const fs = inject(FirestoreService);
    const sales$ = fs.getCollection<Sale>('sales', orderBy('date', 'desc'));
    const sales = toSignal(sales$, { initialValue: [] as Sale[] });
    const pendingOrders = computed(() => sales().filter((sale) => sale.status === 'pending'));

    return {
      sales,
      pendingOrders,
      pendingOrdersCount: computed(() => pendingOrders().length),
      recentSales: computed(() => sales().slice(0, 5)),
    };
  }),

  withMethods((store) => {
    const salesService = inject(SalesService);

    return {
      async registerSale(sale: SaleInput) {
        patchState(store, { loading: true, error: null });
        try {
          const saleId = await salesService.registerSale(sale);
          patchState(store, { loading: false });
          return saleId;
        } catch (error: unknown) {
          patchState(store, { loading: false, error: getErrorMessage(error) });
          throw error;
        }
      },

      async updateSale(id: string, updatedSale: SaleInput) {
        patchState(store, { loading: true, error: null });
        try {
          const oldSale = store.sales().find((candidate) => candidate.id === id);
          await salesService.updateSale(id, updatedSale, oldSale);
          patchState(store, { loading: false });
        } catch (error: unknown) {
          patchState(store, { loading: false, error: getErrorMessage(error) });
          throw error;
        }
      },

      async updateSaleStatus(id: string, status: Sale['status']) {
        patchState(store, { loading: true, error: null });
        try {
          const sale = store.sales().find((candidate) => candidate.id === id);
          await salesService.updateSaleStatus(id, status, sale);
          patchState(store, { loading: false });
        } catch (error: unknown) {
          patchState(store, { loading: false, error: getErrorMessage(error) });
          throw error;
        }
      },
    };
  }),
);
