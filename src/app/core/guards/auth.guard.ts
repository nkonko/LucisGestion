import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Redirects to /login if not authenticated.
 * Waits for auth initialization before deciding.
 */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // If auth hasn't initialized yet, wait for it
  return new Promise<boolean>((resolve) => {
    const check = () => {
      if (!auth.ready()) {
        setTimeout(check, 50);
        return;
      }
      if (auth.isLoggedIn()) {
        resolve(true);
      } else {
        router.navigate(['/login']);
        resolve(false);
      }
    };
    check();
  });
};

/**
 * Only allows 'owner' role. Must be used after authGuard.
 */
export const ownerGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.isOwner();
};
