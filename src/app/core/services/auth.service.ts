import { Injectable, inject, isDevMode } from '@angular/core';
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

  constructor() {
    onAuthStateChanged(this.auth, (user) => {
      this.pendingAuthChange = this.handleAuthChange(user);
    });
  }

  async loginWithGoogle(): Promise<void> {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(this.auth, provider);

    const email = result.user.email?.toLowerCase() ?? '';
    if (!environment.allowedEmails.includes(email)) {
      await signOut(this.auth);
      throw new Error('Tu cuenta no tiene acceso a esta app.');
    }

    await this.pendingAuthChange;

    if (!this.authStore.appUser()) {
      throw new Error('No se pudo cargar el perfil de usuario.');
    }
  }

  async logout(): Promise<void> {
    await signOut(this.auth);
  }

  /** Owner can change another user's role */
  async setUserRole(uid: string, role: UserRole): Promise<void> {
    const userRef = doc(this.firestore, 'users', uid);
    await setDoc(userRef, { role }, { merge: true });
  }

  private async handleAuthChange(user: User | null): Promise<void> {
    if (!user) {
      this.authStore.setAuthState(null, true);
      return;
    }

    const email = user.email?.toLowerCase() ?? '';
    if (!environment.allowedEmails.includes(email)) {
      await signOut(this.auth);
      this.authStore.setAuthState(null, true);
      return;
    }

    try {
      const appUser = await this.loadOrCreateProfile(user);
      this.authStore.setAuthState(appUser, true);
    } catch (error: unknown) {
      if (isDevMode()) console.error('Login failed - unable to load user profile:', error);
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
