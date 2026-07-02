import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { Auth } from '@angular/fire/auth';
import { Firestore } from '@angular/fire/firestore';
vi.mock('@angular/fire/auth', () => ({
  Auth: {} as never,
  GoogleAuthProvider: vi.fn(),
  onAuthStateChanged: vi.fn(),
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
}));
vi.mock('@angular/fire/firestore', () => ({
  Firestore: {} as never,
  Timestamp: {} as never,
  doc: vi.fn(),
  collection: vi.fn(),
  limit: vi.fn(),
  query: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  setDoc: vi.fn(),
}));
import * as authApi from '@angular/fire/auth';
import * as fsApi from '@angular/fire/firestore';
import { AuthStore } from '../store/auth.store';
import { environment } from '../../../environments/environment';

const mockedAuthApi = vi.mocked(authApi);

describe('AuthService', () => {
  let service: AuthService;
  const authStoreMock = { appUser: vi.fn(), setAuthState: vi.fn() };

  beforeEach(() => {
    vi.restoreAllMocks();
    authStoreMock.appUser.mockReset();
    authStoreMock.setAuthState.mockReset();
    mockedAuthApi.onAuthStateChanged.mockImplementation(() => vi.fn());

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

  it('creates auth change promise before popup login flow', async () => {
    const originalAllowedEmails = [...environment.allowedEmails];
    try {
      environment.allowedEmails = [...originalAllowedEmails, 'owner@example.com'];

      authStoreMock.appUser.mockReturnValue({ uid: 'u1' });
      vi.spyOn(
        service as unknown as { waitForAuthChange: () => Promise<void> },
        'waitForAuthChange',
      ).mockResolvedValue();
      vi.spyOn(authApi, 'signInWithPopup').mockImplementation(async () => {
        const privateService = service as unknown as { pendingAuthChange: Promise<void> | null };
        expect(privateService.pendingAuthChange).not.toBeNull();
        return { user: { email: 'owner@example.com' } } as never;
      });

      await service.loginWithGoogle();
    } finally {
      environment.allowedEmails = originalAllowedEmails;
    }
  });
});
