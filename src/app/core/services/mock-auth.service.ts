import { Injectable, signal, computed } from '@angular/core';
import { type UserRole, type AppUser } from './auth.service';

@Injectable()
export class MockAuthService {
  private readonly _appUser = signal<AppUser | null>({
    uid: 'mock-owner-uid',
    email: 'demo@lucis.com',
    displayName: 'Demo (modo prueba)',
    photoURL: '',
    role: 'owner',
  });

  private readonly _ready = signal(true);

  readonly user = signal(null).asReadonly();
  readonly appUser = this._appUser.asReadonly();
  readonly ready = this._ready.asReadonly();
  readonly isLoggedIn = computed(() => !!this._appUser());
  readonly isOwner = computed(() => this._appUser()?.role === 'owner');
  readonly isAssistant = computed(() => this._appUser()?.role === 'assistant');

  async loginWithGoogle(): Promise<void> {
    this._appUser.set({
      uid: 'mock-owner-uid',
      email: 'demo@lucis.com',
      displayName: 'Demo (modo prueba)',
      photoURL: '',
      role: 'owner',
    });
  }

  async logout(): Promise<void> {
    this._appUser.set(null);
  }

  async setUserRole(_uid: string, _role: UserRole): Promise<void> {
    // no-op in mock mode
  }
}
