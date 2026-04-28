import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { FirestoreService } from './core/services/firestore.service';
import { MockFirestoreService } from './core/services/mock-firestore.service';
import { AuthService } from './core/services/auth.service';
import { MockAuthService } from './core/services/mock-auth.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    { provide: FirestoreService, useClass: MockFirestoreService },
    { provide: AuthService, useClass: MockAuthService },
  ],
};
