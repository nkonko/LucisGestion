import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { DemoModeService } from '../services/demo-mode.service';
import { AuthStore } from '../store/auth.store';
import { AppUser } from '../models/user/app-user.model';

export const demoGuard: CanActivateFn = () => {
  const demoService = inject(DemoModeService);
  const authStore = inject(AuthStore);

  // Activar modo demo
  demoService.enterDemoMode();

  // Crear usuario demo
  const demoUser: AppUser = {
    uid: 'demo-user',
    email: 'demo@lucis.com',
    displayName: 'Usuario Demo',
    photoURL: '',
    role: 'owner',
  };

  // Establecer el usuario demo en el auth store
  authStore.setAuthState(demoUser, true);

  return true;
};
