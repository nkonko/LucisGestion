# Deployment Guide — Lucis Gestión

This guide explains how to configure and deploy Lucis Gestión to Firebase Hosting for a production-like TFM review.

## Current Public Deployment

- **Application:** <https://lucis-gestion-6cea2.web.app/>
- **Demo mode:** <https://lucis-gestion-6cea2.web.app/demo>
- **Recommended evaluator access:** demo mode, because it does not require login and includes sample data.

## 1. Prerequisites

| Tool | Version / requirement | Check command |
|---|---|---|
| Node.js | `>=22.22.3` | `node --version` |
| pnpm | `11.1.1` or compatible | `pnpm --version` |
| Angular CLI | Compatible with Angular 22 | `pnpm ng version` |
| Firebase CLI | Required for deploy | `firebase --version` |

Install dependencies:

```bash
pnpm install
```

Install Firebase CLI if it is not available:

```bash
pnpm install -g firebase-tools
```

Authenticate with Firebase:

```bash
firebase login
```

## 2. Firebase Project Setup

1. Open <https://console.firebase.google.com/>.
2. Create or select a Firebase project.
3. Register a web application.
4. Enable Firebase Hosting during app registration.
5. Copy the Firebase web configuration object.

Example configuration shape:

```ts
const firebaseConfig = {
  apiKey: '...',
  authDomain: 'lucis-gestion-6cea2.firebaseapp.com',
  projectId: 'lucis-gestion-6cea2',
  storageBucket: 'lucis-gestion-6cea2.appspot.com',
  messagingSenderId: '...',
  appId: '...',
};
```

## 3. Authentication Setup

1. Go to **Firebase Console → Authentication**.
2. Open **Sign-in method**.
3. Enable **Google**.
4. Add a support email.
5. In **Settings → Authorized domains**, verify that the deployed domain is present:
   - `lucis-gestion-6cea2.web.app`
   - `localhost` for local development

## 4. Firestore Setup

1. Go to **Firebase Console → Firestore Database**.
2. Create a database.
3. Select the closest region to the expected users.
4. Start with temporary test rules only if the project is not public yet.
5. Deploy the repository rules before real usage.

The application creates collections automatically when data is written. Main collections include:

| Collection | Purpose |
|---|---|
| `users` | Authenticated user profile and role |
| `ingredientes` | Ingredients, stock, prices, and categories |
| `recetas` | Recipes and cost information |
| `ventas` | Orders and sales history |
| `clientes` | Customer records |
| `movimientosStock` | Inventory movements |
| `gastosInsumos` | Ingredient purchase expenses |
| `historialPrecios` | Ingredient price changes |
| `costosFijos` | Monthly fixed costs |

## 5. Environment Configuration

Create or update `src/environments/environment.ts` with the Firebase configuration:

```ts
export const environment = {
  production: false,
  firebase: {
    apiKey: 'YOUR_API_KEY',
    authDomain: 'lucis-gestion-6cea2.firebaseapp.com',
    projectId: 'lucis-gestion-6cea2',
    storageBucket: 'lucis-gestion-6cea2.appspot.com',
    messagingSenderId: 'YOUR_SENDER_ID',
    appId: 'YOUR_APP_ID',
  },
};
```

For production builds, keep the production environment aligned with the same Firebase project and set `production: true` if a dedicated production file is used.

## 6. Firebase Project Alias

Ensure `.firebaserc` points to the intended Firebase project:

```json
{
  "projects": {
    "default": "lucis-gestion-6cea2"
  }
}
```

## 7. Local Verification Before Deploy

Run the Firebase-backed application:

```bash
pnpm start
```

Run the mock/demo version without Firebase:

```bash
pnpm start:mock
```

Run checks before deployment:

```bash
pnpm test
pnpm lint
pnpm build
```

## 8. Production Build and Deploy

Build the application:

```bash
pnpm build
```

Deploy hosting, Firestore rules, and indexes:

```bash
firebase deploy
```

Deploy only hosting if rules and indexes did not change:

```bash
firebase deploy --only hosting
```

Deploy only Firestore rules and indexes:

```bash
firebase deploy --only firestore
```

Expected final output includes a Firebase Hosting URL similar to:

```text
Hosting URL: https://lucis-gestion-6cea2.web.app
```

## 9. Post-deploy Checklist

- Open <https://lucis-gestion-6cea2.web.app/> and verify that the landing page loads.
- Open <https://lucis-gestion-6cea2.web.app/demo> and verify that demo data appears without login.
- Test Google login from the production entry point.
- Verify direct navigation to nested routes such as `/demo/dashboard` and `/app/dashboard`.
- Confirm Firestore rules are published from `firestore.rules`.
- Confirm Firestore indexes are published from `firestore.indexes.json`.
- Confirm the PWA manifest loads correctly.

## 10. Troubleshooting

| Problem | Likely cause | Suggested fix |
|---|---|---|
| Blank page after deploy | Build output path mismatch | Check `firebase.json` hosting `public` directory |
| Google login fails | Unauthorized domain | Add the domain in Firebase Authentication settings |
| Firestore permission denied | Rules or user role mismatch | Review `firestore.rules` and user role in `users/{uid}` |
| Local Firebase mode fails | Missing environment config | Update `src/environments/environment.ts` |
| Demo mode data disappears | Expected in-memory behavior | Refreshing resets mock state by design |

## 11. Notes for TFM Evaluation

The preferred evaluation path is the public demo URL because it avoids account creation and gives the reviewer immediate access to a representative bakery dataset:

```text
https://lucis-gestion-6cea2.web.app/demo
```
