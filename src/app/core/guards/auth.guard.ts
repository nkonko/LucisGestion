import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, firstValueFrom } from 'rxjs';
import { AuthStore } from '../store/auth.store';

export const authGuard: CanActivateFn = async () => {
  const authStore = inject(AuthStore);
  const router = inject(Router);
  const ready$ = toObservable(authStore.ready);
  const isLoggedIn$ = toObservable(authStore.isLoggedIn);

  await firstValueFrom(ready$.pipe(filter((ready) => ready)));
  const isLoggedIn = await firstValueFrom(isLoggedIn$);

  if (isLoggedIn) {
    return true;
  }

  return router.createUrlTree(['/login']);
};
