import { computed } from '@angular/core';
import { signalStore, withComputed, withMethods, withState, patchState } from '@ngrx/signals';
import { AppUser } from '../models/user/app-user.model';
import { AuthState } from './state/auth.state';

const initialState: AuthState = {
  appUser: null,
  ready: false,
};

export const AuthStore = signalStore(
  { providedIn: 'root' },
  withState<AuthState>(initialState),
  withComputed((store) => ({
    isLoggedIn: computed(() => !!store.appUser()),
    isOwner: computed(() => store.appUser()?.role === 'owner'),
    isAssistant: computed(() => store.appUser()?.role === 'assistant'),
  })),
  withMethods((store) => ({
    setAuthState(appUser: AppUser | null, ready: boolean) {
      patchState(store, { appUser, ready });
    },
  })),
);
