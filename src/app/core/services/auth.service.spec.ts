import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { Auth, User, signOut } from '@angular/fire/auth';
import { Firestore, getDoc, getDocs, setDoc } from '@angular/fire/firestore';
import { AuthStore } from '../store/auth.store';

describe('AuthService', () => {
  let service: AuthService;
  const authStoreMock = { appUser: vi.fn(), setAuthState: vi.fn() };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: Auth, useValue: {} },
        { provide: Firestore, useValue: {} },
        { provide: AuthStore, useValue: authStoreMock },
      ],
    });

    service = TestBed.inject(AuthService);
  });

  it('rejects not allowed user on auth change', async () => {
    const signOutSpy = vi.spyOn({ signOut }, 'signOut').mockResolvedValue(undefined as never);
    await (service as never).handleAuthChange({ email: 'not-allowed@example.com' } as User);
    expect(signOutSpy).toHaveBeenCalled();
    expect(authStoreMock.setAuthState).toHaveBeenCalledWith(null, true);
  });

  it('creates first user as owner', async () => {
    vi.spyOn({ getDoc }, 'getDoc').mockResolvedValue({ exists: () => false } as never);
    vi.spyOn({ getDocs }, 'getDocs').mockResolvedValue({ empty: true } as never);
    const setDocSpy = vi.spyOn({ setDoc }, 'setDoc').mockResolvedValue(undefined as never);

    const profile = await (service as never).loadOrCreateProfile({ uid: 'u1', email: 'a@b.com', displayName: 'A', photoURL: '' } as User);

    expect(profile.role).toBe('owner');
    expect(setDocSpy).toHaveBeenCalled();
  });

  it('creates subsequent users as assistant', async () => {
    vi.spyOn({ getDoc }, 'getDoc').mockResolvedValue({ exists: () => false } as never);
    vi.spyOn({ getDocs }, 'getDocs').mockResolvedValue({ empty: false } as never);
    vi.spyOn({ setDoc }, 'setDoc').mockResolvedValue(undefined as never);

    const profile = await (service as never).loadOrCreateProfile({ uid: 'u2', email: 'b@b.com', displayName: 'B', photoURL: '' } as User);

    expect(profile.role).toBe('assistant');
  });
});
