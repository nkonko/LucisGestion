import {
  ApplicationConfig,
  ErrorHandler,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  isDevMode,
  inject,
} from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import {
  FirebaseApp,
  provideFirebaseApp,
  initializeApp,
} from '@angular/fire/app';
import { provideFirestore, initializeFirestore } from '@angular/fire/firestore';
import { provideAuth, getAuth } from '@angular/fire/auth';
import {
  browserSessionPersistence,
  setPersistence,
} from 'firebase/auth';

import { routes } from './app.routes';
import { provideServiceWorker } from '@angular/service-worker';
import { environment } from '../environments/environment';
import * as Sentry from '@sentry/angular';
import { AuthService } from './core/services/auth.service';
import { FirestoreService } from './core/services/firestore.service';
import { DemoAwareFirestoreService } from './core/services/demo-aware-firestore.service';
import { AppUpdateService } from './core/services/app-update.service';

function isDemoRoute(): boolean {
  return typeof window !== 'undefined' && window.location.pathname.startsWith('/demo');
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    {
      provide: ErrorHandler,
      useValue: Sentry.createErrorHandler(),
    },
    {
      provide: Sentry.TraceService,
      deps: [Router],
    },
    provideAppInitializer(() => {
      inject(Sentry.TraceService);
    }),
    { provide: FirestoreService, useClass: DemoAwareFirestoreService },
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideFirestore((injector) =>
      initializeFirestore(injector.get(FirebaseApp), {
        experimentalAutoDetectLongPolling: true,
      }),
    ),
    provideAuth((injector) => getAuth(injector.get(FirebaseApp))),
    provideAppInitializer(() => {
      if (isDemoRoute()) {
        return;
      }

      const firebaseApp = inject(FirebaseApp);
      inject(AuthService);
      const auth = getAuth(firebaseApp);

      return setPersistence(auth, browserSessionPersistence);
    }),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode() && environment.production,
      registrationStrategy: 'registerWhenStable:30000',
    }),
    provideAppInitializer(() => {
      inject(AppUpdateService);
    }),
  ],
};
