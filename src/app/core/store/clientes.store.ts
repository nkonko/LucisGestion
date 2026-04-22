import { inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { FirestoreService } from '../services/firestore.service';
import { Cliente, ClienteInput } from '../models/cliente';
import { orderBy } from '@angular/fire/firestore';
import { toSignal } from '@angular/core/rxjs-interop';
import { BaseState } from '../interfaces/state';

export const ClientesStore = signalStore(
  { providedIn: 'root' },
  withState<BaseState>({ loading: false, error: null }),

  withMethods((store) => {
    const fs = inject(FirestoreService);

    const clientes$ = fs.getCollection<Cliente>('clientes', orderBy('nombre', 'asc'));
    const clientes = toSignal(clientes$, { initialValue: [] as Cliente[] });

    return {
      clientes,

      async crearCliente(cliente: ClienteInput) {
        try {
          return await fs.addDocument('clientes', cliente);
        } catch (e: any) {
          patchState(store, { error: e.message });
          throw e;
        }
      },

      async actualizarCliente(id: string, changes: Partial<Cliente>) {
        try {
          return await fs.updateDocument('clientes', id, changes);
        } catch (e: any) {
          patchState(store, { error: e.message });
          throw e;
        }
      },

      async deleteCliente(id: string) {
        try {
          return await fs.updateDocument('clientes', id, { nombre: '[eliminado]' });
        } catch (e: any) {
          patchState(store, { error: e.message });
          throw e;
        }
      },
    };
  }),
);
