import { Injectable, inject, isDevMode } from '@angular/core';
import * as Sentry from '@sentry/angular';
import {
  Auth,
  GoogleAuthProvider,
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from '@angular/fire/auth';
import {
  Firestore,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  setDoc,
} from '@angular/fire/firestore';
import { environment } from '../../../environments/environment';
import { AppUser } from '../models/user/app-user.model';
import { UserRole } from '../models/user/user-role.model';
import { AuthStore } from '../store/auth.store';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private authStore = inject(AuthStore);

  private pendingAuthChange: Promise<void> | null = null;
  private authChangeResolver: (() => void) | null = null;

  constructor() {
    onAuthStateChanged(this.auth, (user) => {
      this.handleAuthChange(user).then(() => {
        this.authChangeResolver?.();
        this.authChangeResolver = null;
        this.pendingAuthChange = null;
      });
    });
  }

  private createAuthChangePromise(): Promise<void> {
    this.pendingAuthChange = new Promise((resolve) => {
      this.authChangeResolver = resolve;
    });

    return this.pendingAuthChange;
  }

  async loginWithGoogle(): Promise<void> {
    void this.createAuthChangePromise();

    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(this.auth, provider);

    const email = result.user.email?.toLowerCase() ?? '';
    if (!environment.allowedEmails.includes(email)) {
      await signOut(this.auth);
      throw new Error('Tu cuenta no tiene acceso a esta app.');
    }

    await this.waitForAuthChange();

    if (!this.authStore.appUser()) {
      throw new Error('No se pudo cargar el perfil de usuario.');
    }
  }

  async logout(): Promise<void> {
    void this.createAuthChangePromise();
    await signOut(this.auth);
    // Esperar a que Firebase procese completamente el cambio de autenticación
    await this.waitForAuthChange();
    // Limpiar explícitamente el sessionStorage para asegurar que no queda rastro
    try {
      const keys = Object.keys(sessionStorage);
      keys.forEach(key => {
        if (key.includes('firebase') || key.includes('auth')) {
          sessionStorage.removeItem(key);
        }
      });
    } catch {
      // Ignorar errores de sessionStorage
    }
  }

  private async waitForAuthChange(): Promise<void> {
    if (this.pendingAuthChange) {
      await this.pendingAuthChange;
    }
    // Espera adicional para asegurar que todo esté sincronizado
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  /** Owner can change another user's role */
  async setUserRole(uid: string, role: UserRole): Promise<void> {
    const userRef = doc(this.firestore, 'users', uid);
    await setDoc(userRef, { role }, { merge: true });
  }

  private async handleAuthChange(user: User | null): Promise<void> {
    if (!user) {
      Sentry.setUser(null);
      this.authStore.setAuthState(null, true);
      return;
    }

    const email = user.email?.toLowerCase() ?? '';
    if (!environment.allowedEmails.includes(email)) {
      Sentry.captureMessage('Intento de login con email no autorizado', {
        level: 'warning',
        tags: { area: 'auth', operation: 'unauthorized_email' },
        extra: { email },
      });
      await signOut(this.auth);
      Sentry.setUser(null);
      this.authStore.setAuthState(null, true);
      return;
    }

    try {
      const appUser = await this.loadOrCreateProfile(user);
      Sentry.setUser({
        id: appUser.uid,
        email: appUser.email,
        username: appUser.displayName,
      });
      Sentry.setTag('user_role', appUser.role);
      this.authStore.setAuthState(appUser, true);
    } catch (error: unknown) {
      if (isDevMode()) console.error('Login failed - unable to load user profile:', error);
      Sentry.captureException(error, {
        tags: {
          area: 'auth',
          operation: 'handle_auth_change',
        },
        extra: {
          uid: user.uid,
          email,
        },
      });
      Sentry.setUser(null);
      this.authStore.setAuthState(null, true);
    }
  }

  /**
   * Load user profile from Firestore, or create a new one.
   * First user ever gets 'owner' role, subsequent users get 'assistant'.
   */
  private async loadOrCreateProfile(user: User): Promise<AppUser> {
    const userRef = doc(this.firestore, 'users', user.uid);
    const snap = await getDoc(userRef);

    if (snap.exists()) {
      const data = snap.data() as Omit<AppUser, 'uid'>;
      return { uid: user.uid, ...data };
    }

    const usersRef = collection(this.firestore, 'users');
    const existing = await getDocs(query(usersRef, limit(1)));
    const role: UserRole = existing.empty ? 'owner' : 'assistant';

    const profile: AppUser = {
      uid: user.uid,
      email: user.email ?? '',
      displayName: user.displayName ?? '',
      photoURL: user.photoURL ?? '',
      role,
    };

    await setDoc(userRef, {
      email: profile.email,
      displayName: profile.displayName,
      photoURL: profile.photoURL,
      role: profile.role,
    });

    return profile;
  }
}
