import { Injectable, inject, signal, computed } from '@angular/core';
import {
  Auth,
  signInWithPopup,
  signOut,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
} from '@angular/fire/auth';
import { Firestore, doc, getDoc, setDoc } from '@angular/fire/firestore';
import { environment } from '../../../environments/environment';

export type UserRole = 'owner' | 'assistant';

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: UserRole;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);

  /** Current Firebase user */
  private _user = signal<User | null>(null);
  /** User profile with role from Firestore */
  private _appUser = signal<AppUser | null>(null);
  /** Auth initialization complete */
  private _ready = signal(false);

  readonly user = this._user.asReadonly();
  readonly appUser = this._appUser.asReadonly();
  readonly ready = this._ready.asReadonly();
  readonly isLoggedIn = computed(() => !!this._appUser());
  readonly isOwner = computed(() => this._appUser()?.role === 'owner');
  readonly isAssistant = computed(() => this._appUser()?.role === 'assistant');

  constructor() {
    onAuthStateChanged(this.auth, async (user) => {
      this._user.set(user);
      try {
        if (user) {
          await this.loadOrCreateProfile(user);
        } else {
          this._appUser.set(null);
        }
      } catch {
        this._appUser.set(null);
      } finally {
        this._ready.set(true);
      }
    });
  }

  async loginWithGoogle(): Promise<void> {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(this.auth, provider);
    const email = result.user.email?.toLowerCase() ?? '';
    if (!environment.allowedEmails.includes(email)) {
      await signOut(this.auth);
      this._appUser.set(null);
      throw new Error('Tu cuenta no tiene acceso a esta app.');
    }

    await this.loadOrCreateProfile(result.user);
  }

  async logout(): Promise<void> {
    await signOut(this.auth);
    this._appUser.set(null);
  }

  /**
   * Load user profile from Firestore, or create a new one.
   * First user ever gets 'owner' role, subsequent users get 'assistant'.
   */
  private async loadOrCreateProfile(user: User): Promise<void> {
    // Double-check whitelist on auth state restore (e.g. page reload)
    const email = user.email?.toLowerCase() ?? '';
    if (!environment.allowedEmails.includes(email)) {
      await signOut(this.auth);
      this._appUser.set(null);
      return;
    }

    const userRef = doc(this.firestore, 'users', user.uid);
    const snap = await getDoc(userRef);

    if (snap.exists()) {
      const data = snap.data() as Omit<AppUser, 'uid'>;
      this._appUser.set({ uid: user.uid, ...data });
    } else {
      // Check if this is the very first user (= owner)
      const { collection, getDocs, limit, query } = await import('@angular/fire/firestore');
      const usersRef = collection(this.firestore, 'users');
      const q = query(usersRef, limit(1));
      const existing = await getDocs(q);
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

      this._appUser.set(profile);
    }
  }

  /** Owner can change another user's role */
  async setUserRole(uid: string, role: UserRole): Promise<void> {
    const userRef = doc(this.firestore, 'users', uid);
    await setDoc(userRef, { role }, { merge: true });
  }
}
