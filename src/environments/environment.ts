/**
 * Placeholder seguro para CI/mock (sin secretos reales).
 * Si necesitas overrides locales, usa environment.local.ts (ignorado por git).
 */
export const environment = {
  production: false,
  sentry: {
    dsn: 'https://f5df02e2752c73d6f764e87e570482c0@o4511600692035584.ingest.de.sentry.io/4511600698851408',
  },
  allowedEmails: ['YOUR_EMAIL@example.com'],
  gemini: {
    apiKey: 'YOUR_GEMINI_API_KEY',
    model: 'MODEL',
    baseUrl: 'YOUR_GEMINI_BASE_URL',
  },
  firebase: {
    apiKey: 'YOUR_API_KEY',
    authDomain: 'YOUR_PROJECT.firebaseapp.com',
    projectId: 'YOUR_PROJECT',
    storageBucket: 'YOUR_PROJECT.appspot.com',
    messagingSenderId: 'YOUR_SENDER_ID',
    appId: 'YOUR_APP_ID',
  },
};
