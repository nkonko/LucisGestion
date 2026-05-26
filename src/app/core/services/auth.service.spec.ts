import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { Auth } from '@angular/fire/auth';
import { Firestore } from '@angular/fire/firestore';
vi.mock('@angular/fire/auth', () => ({
  onAuthStateChanged: vi.fn(),
  signOut: vi.fn(),
}));
vi.mock('@angular/fire/firestore', () => ({
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  setDoc: vi.fn(),
}));
import * as authApi from '@angular/fire/auth';
import * as fsApi from '@angular/fire/firestore';
import { AuthStore } from '../store/auth.store';

describe.skip('AuthService', () => {
  let service: AuthService;
  const authStoreMock = { appUser: vi.fn(), setAuthState: vi.fn() };

  beforeEach(() => {
    vi.restoreAllMocks();
    authStoreMock.appUser.mockReset();
    authStoreMock.setAuthState.mockReset();
    (authApi.onAuthStateChanged as unknown as any).mockImplementation(() => vi.fn());

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

  it('rejects non-allowed user during auth change', async () => {
    const signOutSpy = vi.spyOn(authApi, 'signOut').mockResolvedValue();
    const privateService = service as unknown as { handleAuthChange: (user: { email?: string } | null) => Promise<void> };

    await privateService.handleAuthChange({ email: 'not-allowed@example.com' });

    expect(signOutSpy).toHaveBeenCalled();
    expect(authStoreMock.setAuthState).toHaveBeenCalledWith(null, true);
  });

  it('creates first user as owner', async () => {
    vi.spyOn(fsApi, 'getDoc').mockResolvedValue({ exists: () => false } as never);
    vi.spyOn(fsApi, 'getDocs').mockResolvedValue({ empty: true } as never);
    vi.spyOn(fsApi, 'setDoc').mockResolvedValue();

    const privateService = service as unknown as { loadOrCreateProfile: (user: { uid: string; email: string; displayName: string; photoURL: string }) => Promise<{ role: string }> };
    const profile = await privateService.loadOrCreateProfile({ uid: 'u1', email: 'owner@example.com', displayName: 'Owner', photoURL: '' });

    expect(profile.role).toBe('owner');
  });

  it('creates subsequent users as assistant', async () => {
    vi.spyOn(fsApi, 'getDoc').mockResolvedValue({ exists: () => false } as never);
    vi.spyOn(fsApi, 'getDocs').mockResolvedValue({ empty: false } as never);
    vi.spyOn(fsApi, 'setDoc').mockResolvedValue();

    const privateService = service as unknown as { loadOrCreateProfile: (user: { uid: string; email: string; displayName: string; photoURL: string }) => Promise<{ role: string }> };
    const profile = await privateService.loadOrCreateProfile({ uid: 'u2', email: 'assistant@example.com', displayName: 'Assistant', photoURL: '' });

    expect(profile.role).toBe('assistant');
  });
});
