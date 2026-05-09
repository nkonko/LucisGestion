import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, firstValueFrom } from 'rxjs';
import { AuthStore } from '../store/auth.store';

export const guestGuard: CanActivateFn = async () => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  await firstValueFrom(toObservable(authStore.ready).pipe(filter(Boolean)));

  return authStore.isLoggedIn() ? router.createUrlTree(['/dashboard']) : true;
};
