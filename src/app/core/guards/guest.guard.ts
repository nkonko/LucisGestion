import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, firstValueFrom } from 'rxjs';
import { AuthStore } from '../store/auth.store';
import { DemoModeService } from '../services/demo-mode.service';

export const guestGuard: CanActivateFn = async () => {
  const authStore = inject(AuthStore);
  const router = inject(Router);
  const demoMode = inject(DemoModeService);

  await firstValueFrom(toObservable(authStore.ready).pipe(filter(Boolean)));

  if (demoMode.isDemoMode()) {
    demoMode.exitDemoMode();
    authStore.setAuthState(null, true);
    return true;
  }

  return authStore.isLoggedIn() ? router.createUrlTree(['/app/dashboard']) : true;
};
