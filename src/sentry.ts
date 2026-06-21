import * as Sentry from '@sentry/angular';
import { environment } from './environments/environment';

export const sentryDsn = environment.sentry?.dsn;

export function initSentry(): void {
  Sentry.init({
    dsn: sentryDsn,
    enabled: Boolean(sentryDsn),
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    tracesSampleRate: environment.production ? 0.2 : 1,
    replaysSessionSampleRate: environment.production ? 0.1 : 1,
    replaysOnErrorSampleRate: 1,
    enableLogs: !environment.production,
  });
}