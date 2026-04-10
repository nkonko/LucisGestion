# 🚀 Guía de Despliegue — Lucis Gestión

## Índice

1. [Pre-requisitos](#1-pre-requisitos)
2. [Crear proyecto en Firebase](#2-crear-proyecto-en-firebase)
3. [Configurar autenticación](#3-configurar-autenticación)
4. [Configurar Firestore](#4-configurar-firestore)
5. [Conectar el código con Firebase](#5-conectar-el-código-con-firebase)
6. [Build y deploy](#6-build-y-deploy)
7. [Verificaciones post-deploy](#7-verificaciones-post-deploy)
8. [Cosas que faltan / Mejoras pendientes](#8-cosas-que-faltan--mejoras-pendientes)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. Pre-requisitos

### Software necesario

| Herramienta | Versión mínima | Comando para verificar |
|---|---|---|
| Node.js | 20+ | `node --version` |
| npm | 10+ | `npm --version` |
| Angular CLI | 21+ | `ng version` |
| Firebase CLI | 13+ | `firebase --version` |

### Instalar Firebase CLI (si no lo tenés)

```bash
npm install -g firebase-tools
```

### Iniciar sesión en Firebase desde la terminal

```bash
firebase login
```

Se abrirá el navegador para autenticarte con tu cuenta de Google.

---

## 2. Crear proyecto en Firebase

1. Ir a [Firebase Console](https://console.firebase.google.com/)
2. Click en **"Agregar proyecto"** (o "Add project")
3. Nombre: `lucis-gestion` (o el que quieras)
4. **Desactivar Google Analytics** (no lo necesitamos, simplifica el setup)
5. Click en **"Crear proyecto"**
6. Esperar a que se cree → Click en "Continuar"

### Registrar la Web App

1. En la pantalla principal del proyecto, click en el ícono **Web** (`</>`)
2. Nombre: `Lucis Gestión`
3. **✅ Marcar** "Also set up Firebase Hosting"
4. Click en "Register app"
5. **⚠️ COPIAR la configuración** que aparece (la vas a necesitar en el paso 5):

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "lucis-gestion-XXXXX.firebaseapp.com",
  projectId: "lucis-gestion-XXXXX",
  storageBucket: "lucis-gestion-XXXXX.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

---

## 3. Configurar autenticación

1. En Firebase Console → **Authentication** (menú lateral)
2. Click en **"Comenzar"** / "Get Started"
3. En la pestaña **"Sign-in method"**:
   - Click en **Google**
   - Activar el toggle
   - Agregar un correo de soporte (el tuyo)
   - Click en **Guardar**
4. En la pestaña **"Settings" → "Authorized domains"**:
   - Verificar que `lucis-gestion-XXXXX.web.app` esté listado
   - Si vas a probar localmente, `localhost` ya debería estar

---

## 4. Configurar Firestore

1. En Firebase Console → **Firestore Database** (menú lateral)
2. Click en **"Crear base de datos"** / "Create database"
3. **Ubicación**: elegir la más cercana. Para Argentina: `southamerica-east1` (São Paulo)
   > ⚠️ **LA UBICACIÓN NO SE PUEDE CAMBIAR DESPUÉS**
4. Reglas de seguridad: elegir **"Empezar en modo de prueba"** (las vamos a reemplazar)
5. Click en "Crear"

### Subir las reglas de seguridad

Las reglas ya están definidas en el archivo `firestore.rules` del proyecto. Se suben automáticamente con `firebase deploy`. Pero si querés verificar antes:

1. En Firebase Console → Firestore → pestaña **"Reglas"**
2. Copiar el contenido de `firestore.rules` del proyecto
3. Click en "Publicar"

### Colecciones que se crean automáticamente

No necesitás crear colecciones manualmente. Se crean solas cuando la app escribe el primer documento:

| Colección | Se crea cuando... |
|---|---|
| `users` | Primer login |
| `ingredientes` | Se crea el primer ingrediente |
| `recetas` | Se crea la primera receta |
| `ventas` | Se registra la primera venta |
| `clientes` | Se crea el primer cliente |
| `movimientosStock` | Se registra la primera venta (automático) |
| `gastosInsumos` | Se registra la primera compra de insumos |
| `historialPrecios` | Se cambia el precio de un ingrediente |

---

## 5. Conectar el código con Firebase

### 5.1 Archivo de environment

Editar `src/environments/environment.ts` y reemplazar los placeholders:

```typescript
export const environment = {
  production: false,
  firebase: {
    apiKey: 'TU_API_KEY_REAL',
    authDomain: 'lucis-gestion-XXXXX.firebaseapp.com',
    projectId: 'lucis-gestion-XXXXX',
    storageBucket: 'lucis-gestion-XXXXX.appspot.com',
    messagingSenderId: 'TU_SENDER_ID',
    appId: 'TU_APP_ID',
  },
};
```

### 5.2 Crear environment de producción

Crear archivo `src/environments/environment.prod.ts`:

```typescript
export const environment = {
  production: true,
  firebase: {
    apiKey: 'TU_API_KEY_REAL',
    authDomain: 'lucis-gestion-XXXXX.firebaseapp.com',
    projectId: 'lucis-gestion-XXXXX',
    storageBucket: 'lucis-gestion-XXXXX.appspot.com',
    messagingSenderId: 'TU_SENDER_ID',
    appId: 'TU_APP_ID',
  },
};
```

> ℹ️ Pueden ser iguales. La diferencia es el flag `production: true`.

### 5.3 Archivo `.firebaserc`

Editar `.firebaserc` y reemplazar el project ID:

```json
{
  "projects": {
    "default": "lucis-gestion-XXXXX"
  }
}
```

> Usá el mismo `projectId` que copiaste de la configuración de Firebase.

---

## 6. Build y deploy

### Probar en modo desarrollo (local)

```bash
cd lucis-gestion
npm start
```

Abrir `http://localhost:4200` — verificar que el login con Google funcione.

### Probar en modo mock (sin Firebase)

Si querés verificar que la UI funciona antes de configurar Firebase:

```bash
npm run start:mock
```

Esto levanta la app con datos de prueba en memoria, sin necesidad de Firebase, sin login real. Ideal para hacer una primera revisión o demo rápida. Ver detalle en el [README](../README.md).

### Build de producción

```bash
ng build
```

Esperado: 0 errores, 0 warnings, ~997 kB initial bundle.

La salida va a `dist/lucis-gestion/browser/`.

### Deploy a Firebase Hosting

```bash
firebase deploy
```

Esto sube:
- ✅ La app (hosting)
- ✅ Las reglas de Firestore (`firestore.rules`)
- ✅ Los índices de Firestore (`firestore.indexes.json`)

Al finalizar te da la URL:

```
✔ Deploy complete!

Hosting URL: https://lucis-gestion-XXXXX.web.app
```

### (Opcional) Deploy solo hosting

```bash
firebase deploy --only hosting
```

### (Opcional) Deploy solo reglas

```bash
firebase deploy --only firestore:rules
```

---

## 7. Verificaciones post-deploy

### Checklist obligatorio

- [ ] **Abrir la URL** `https://lucis-gestion-XXXXX.web.app` en el celular
- [ ] **Login con Google** funciona (no da error de dominio no autorizado)
- [ ] **Primer usuario** se registra como `owner` en Firestore → verificar en Console: Firestore → colección `users`
- [ ] **Crear un ingrediente** de prueba → verificar que aparece en Firestore
- [ ] **Crear una receta** → verificar que calcula el costo
- [ ] **Registrar una venta** → verificar que el stock se descuenta
- [ ] **Instalar como PWA**: en Chrome mobile, debería aparecer el banner "Agregar a pantalla de inicio" o desde menú → "Instalar app"
- [ ] **Modo offline**: apagar WiFi/datos, verificar que la app sigue mostrando datos cargados
- [ ] **Segundo usuario**: iniciar sesión con otra cuenta → debe quedar como `ayudante`

### Verificar en Firebase Console

| Qué verificar | Dónde |
|---|---|
| Usuarios registrados | Authentication → Users |
| Datos guardados | Firestore Database → colecciones |
| Reglas activas | Firestore → Rules |
| Tráfico hosting | Hosting → Dashboard |
| Uso del free tier | Usage and billing |

---

## 8. Cosas que faltan / Mejoras pendientes

### 🔴 Crítico (hacer antes de dar acceso a usuarios)

| # | Qué falta | Detalle |
|---|---|---|
| 1 | **Configurar Firebase real** | Reemplazar los placeholders en `environment.ts` y `.firebaserc` con valores reales del proyecto Firebase |
| 2 | **Roles con Custom Claims** | Actualmente los roles se guardan en Firestore (`users/{uid}.role`), pero las Firestore rules usan `request.auth.token.role` (custom claims). **Hay un mismatch**: necesitás una Cloud Function o script Admin SDK que copie el rol de Firestore al token. Alternativa: cambiar las rules para leer de Firestore en vez de claims. Ver sección Troubleshooting |
| 3 | **Environment de producción** | Crear `environment.prod.ts` y configurar `angular.json` para usarlo en build de producción |

### 🟡 Importante (mejora la experiencia)

| # | Qué falta | Detalle |
|---|---|---|
| 4 | **Ocultar UI según rol** | El ayudante ve botones de crear/editar ingredientes y recetas pero Firestore los rechaza. Conviene ocultar esos botones con `@if (auth.isOwner())` |
| 5 | **Teléfonos WhatsApp con código país** | Si los teléfonos no incluyen código país (ej: `+54`), el link `wa.me` no funciona correctamente. Agregar validación o prefijo automático |
| 6 | **Reponer stock en cancelación** | Si se cancela una venta, el stock NO se repone automáticamente. Decidir si implementar o dejarlo como ajuste manual |
| 7 | **Error handling global** | No hay toasts/snackbar para errores de Firestore (offline, permisos). Agregar manejo en el store |
| 8 | **Loading indicators** | El estado `loading` del store no se muestra en la UI. Agregar spinners en operaciones lentas |

### 🟢 Nice-to-have (mejoras futuras)

| # | Idea | Detalle |
|---|---|---|
| 9 | Fotos de recetas | Subir imagen con Firebase Storage |
| 10 | Notificaciones push | FCM para avisar stock bajo |
| 11 | Reportes exportables | Exportar ventas a CSV/Excel |
| 12 | Multi-negocio | Soportar más de una pastelería con un solo login |
| 13 | Backup automático | Firebase scheduled exports |
| 14 | Tests unitarios | Actualmente 0 tests. Agregar al menos para el store |

---

## 9. Troubleshooting

### Error: "auth/unauthorized-domain"

El dominio desde donde accedés no está autorizado en Firebase Auth.

**Solución**: Firebase Console → Authentication → Settings → Authorized domains → Agregar tu dominio.

### Error: "Missing or insufficient permissions" en Firestore

Las Firestore rules requieren `request.auth.token.role` (Custom Claims), pero el sistema actual guarda el rol en un documento de Firestore, no en el token.

**Solución rápida** — Cambiar las rules para leer de Firestore:

```javascript
function getUserRole() {
  return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role;
}

function isOwner() {
  return isSignedIn() && getUserRole() == 'owner';
}
```

> ⚠️ Esto agrega 1 lectura extra de Firestore por cada operación. Es aceptable para volumen bajo (10-30 pedidos/semana) pero no escala. La solución ideal es una Cloud Function que setee Custom Claims.

**Solución ideal** — Cloud Function para custom claims:

```javascript
// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.onUserCreated = functions.firestore
  .document('users/{userId}')
  .onCreate(async (snap, context) => {
    const { role } = snap.data();
    await admin.auth().setCustomUserClaims(context.params.userId, { role });
  });
```

### El service worker cachea una versión vieja

**Solución**: En Chrome DevTools → Application → Service Workers → "Update on reload" o "Unregister".

### La PWA no se instala

Requisitos:
- Debe servirse por HTTPS (Firebase Hosting lo incluye)
- Debe tener `manifest.webmanifest` válido (ya incluido)
- Debe tener Service Worker registrado (ya incluido)
- El usuario debe interactuar con la app al menos 30 segundos

### Build supera el warning de 1 MB

Actualmente el bundle es ~997 kB (muy justo). Si se agregan más features:
- Usar `ng build` con `--stats-json` y analizar con `webpack-bundle-analyzer`
- Verificar que todo sea lazy-loaded
- Considerar quitar módulos de Material no usados

---

## Resumen de archivos a modificar antes del deploy

| Archivo | Qué cambiar |
|---|---|
| `src/environments/environment.ts` | Reemplazar TODOS los placeholders de Firebase config |
| `src/environments/environment.prod.ts` | Crear con los mismos valores + `production: true` |
| `.firebaserc` | Cambiar `YOUR_PROJECT_ID` por el ID real del proyecto |
| `firestore.rules` | (Opcional) Cambiar de custom claims a lectura de Firestore — ver Troubleshooting |

---

## Costos esperados (Plan Spark — Gratis)

| Recurso | Límite gratuito | Uso estimado (10-30 pedidos/semana) |
|---|---|---|
| Firestore reads | 50,000/día | ~500-2,000/día ✅ |
| Firestore writes | 20,000/día | ~50-200/día ✅ |
| Firestore storage | 1 GB | < 10 MB ✅ |
| Hosting storage | 10 GB | ~5 MB ✅ |
| Hosting bandwidth | 10 GB/mes | ~100 MB/mes ✅ |
| Auth users | Sin límite | 2-5 usuarios ✅ |

> Con el volumen esperado, **no hay riesgo de superar el plan gratuito**.
