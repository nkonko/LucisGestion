import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

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
