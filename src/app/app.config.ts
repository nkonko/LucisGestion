import {
  ApplicationConfig,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  isDevMode,
  inject,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import {
  FirebaseApp,
  provideFirebaseApp,
  initializeApp,
} from '@angular/fire/app';
import { provideFirestore, initializeFirestore } from '@angular/fire/firestore';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { browserSessionPersistence, setPersistence } from '@angular/fire/auth';

import { routes } from './app.routes';
import { provideServiceWorker } from '@angular/service-worker';
import { environment } from '../environments/environment';
import { AuthService } from './core/services/auth.service';
import { FirestoreService } from './core/services/firestore.service';
import { DemoAwareFirestoreService } from './core/services/demo-aware-firestore.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    { provide: FirestoreService, useClass: DemoAwareFirestoreService },
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideFirestore((injector) =>
      initializeFirestore(injector.get(FirebaseApp), {
        experimentalAutoDetectLongPolling: true,
      }),
    ),
    provideAuth((injector) => getAuth(injector.get(FirebaseApp))),
    provideAppInitializer(async () => {
      const firebaseApp = inject(FirebaseApp);
      const auth = getAuth(firebaseApp);
      await setPersistence(auth, browserSessionPersistence);
      inject(AuthService);
    }),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode() && environment.production,
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
