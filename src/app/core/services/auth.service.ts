import { Injectable, inject } from '@angular/core';
import {
  Auth,
  signInWithPopup,
  signOut,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
} from '@angular/fire/auth';
import { Firestore, collection, doc, getDoc, getDocs, limit, query, setDoc } from '@angular/fire/firestore';
import {
  catchError,
  combineLatest,
  filter,
  firstValueFrom,
  from,
  fromEventPattern,
  map,
  of,
  shareReplay,
  startWith,
  switchMap,
  take,
} from 'rxjs';
import { environment } from '../../../environments/environment';
import { AppUser } from '../models/user/app-user.model';
import { UserRole } from '../models/user/user-role.model';
import { AuthStore } from '../store/auth.store';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private authStore = inject(AuthStore);

  private readonly authState$ = fromEventPattern<User | null>(
    (handler) => onAuthStateChanged(this.auth, handler),
    (_handler, unsubscribe) => unsubscribe(),
  ).pipe(shareReplay({ bufferSize: 1, refCount: true }));

  private readonly appUserState$ = this.authState$.pipe(
    switchMap((user) =>
      user
        ? from(this.loadOrCreateProfile(user)).pipe(catchError(() => of(null)))
        : of(null),
    ),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  constructor() {
    combineLatest([this.authState$, this.appUserState$])
      .pipe(
        map(([user, appUser]) => ({ user, appUser, ready: true })),
        startWith({ user: null, appUser: null, ready: false }),
      )
      .subscribe(({ user, appUser, ready }) => {
        this.authStore.setAuthState(user, appUser, ready);
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

    await firstValueFrom(
      this.authState$.pipe(
        filter((user): user is User => !!user && user.uid === result.user.uid),
        take(1),
        switchMap(() =>
          this.appUserState$.pipe(
            filter((appUser) => appUser === null || appUser.uid === result.user.uid),
            take(1),
            map((appUser) => {
              if (!appUser) {
                throw new Error('Tu cuenta no tiene acceso a esta app.');
              }
              return appUser;
            }),
          ),
        ),
      ),
    );
  }

  async logout(): Promise<void> {
    await signOut(this.auth);
  }

  /**
   * Load user profile from Firestore, or create a new one.
   * First user ever gets 'owner' role, subsequent users get 'assistant'.
   */
  private async loadOrCreateProfile(user: User): Promise<AppUser | null> {
    // Double-check whitelist on auth state restore (e.g. page reload)
    const email = user.email?.toLowerCase() ?? '';
    if (!environment.allowedEmails.includes(email)) {
      await signOut(this.auth);
      return null;
    }

    const userRef = doc(this.firestore, 'users', user.uid);
    const snap = await getDoc(userRef);

    if (snap.exists()) {
      const data = snap.data() as Omit<AppUser, 'uid'>;
      return { uid: user.uid, ...data };
    }

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

    return profile;
  }

  /** Owner can change another user's role */
  async setUserRole(uid: string, role: UserRole): Promise<void> {
    const userRef = doc(this.firestore, 'users', uid);
    await setDoc(userRef, { role }, { merge: true });
  }
}
