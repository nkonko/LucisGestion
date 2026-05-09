import { Injectable, inject } from '@angular/core';
import { UserRole } from '../models/user/user-role.model';
import { AppUser } from '../models/user/app-user.model';
import { AuthStore } from '../store/auth.store';

@Injectable()
export class MockAuthService {
  private authStore = inject(AuthStore);

  private readonly mockAppUser: AppUser = {
    uid: 'mock-owner-uid',
    email: 'demo@lucis.com',
    displayName: 'Demo (modo prueba)',
    photoURL: '',
    role: 'owner',
  };

  readonly appUser = this.authStore.appUser;
  readonly ready = this.authStore.ready;
  readonly isLoggedIn = this.authStore.isLoggedIn;
  readonly isOwner = this.authStore.isOwner;
  readonly isAssistant = this.authStore.isAssistant;

  constructor() {
    this.authStore.setAuthState(this.mockAppUser, true);
  }

  async loginWithGoogle(): Promise<void> {
    this.authStore.setAuthState(this.mockAppUser, true);
  }

  async logout(): Promise<void> {
    this.authStore.setAuthState(null, true);
  }

  async setUserRole(_uid: string, _role: UserRole): Promise<void> {
    // no-op in mock mode
  }
}
