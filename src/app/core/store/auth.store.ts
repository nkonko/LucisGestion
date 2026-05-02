import { computed } from '@angular/core';
import { signalStore, withComputed, withMethods, withState, patchState } from '@ngrx/signals';
import { User } from '@angular/fire/auth';
import { AppUser } from '../models/user/app-user.model';
import { AuthState } from './state/auth.state';

const initialState: AuthState = {
  user: null,
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
    setAuthState(user: User | null, appUser: AppUser | null, ready: boolean) {
      patchState(store, { user, appUser, ready });
    },
  })),
);
