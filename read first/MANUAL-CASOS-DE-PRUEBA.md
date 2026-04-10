# 🧪 Manual de Casos de Prueba — Lucis Gestión

## Modo Mock (ejecución rápida sin Firebase)

Para ejecutar los casos de prueba sin necesidad de Firebase configurado:

```bash
npm run start:mock
```

La app se levanta con datos de ejemplo precargados (ingredientes, recetas, clientes y ventas). El usuario queda auto-logueado como owner. Los datos se pierden al refrescar.

> **Nota**: Los casos CP-01 a CP-04 (autenticación) y CP-27/CP-28 (PWA/offline) requieren Firebase real. El resto se pueden validar en modo mock.

## Convenciones

- **Pre-condición**: Estado necesario antes de ejecutar el caso.
- **Pasos**: Acciones a seguir en orden.
- **Resultado esperado**: Lo que debe ocurrir si todo funciona correctamente.
- ✅ = Pasó | ❌ = Falló | ⏳ = Pendiente

---

## 1. Autenticación (Fase 4)

### CP-01: Login con Google — Primer usuario (Owner)

| Campo | Detalle |
|---|---|
| **Pre-condición** | No existe ningún documento en la colección `users` de Firestore |
| **Pasos** | 1. Abrir la app → debería redirigir a `/login` <br> 2. Tocar "Continuar con Google" <br> 3. Seleccionar cuenta de Google |
| **Resultado esperado** | ✅ Se crea documento en `users/{uid}` con `role: 'owner'` <br> ✅ Redirige a `/dashboard` <br> ✅ En el menú de usuario aparece badge "Dueña" |
| **Estado** | ⏳ |

### CP-02: Login con Google — Segundo usuario (Ayudante)

| Campo | Detalle |
|---|---|
| **Pre-condición** | Ya existe al menos un usuario en `users` |
| **Pasos** | 1. Abrir la app en otro navegador/incógnito <br> 2. Tocar "Continuar con Google" con otra cuenta |
| **Resultado esperado** | ✅ Se crea documento con `role: 'ayudante'` <br> ✅ Badge muestra "Ayudante" |
| **Estado** | ⏳ |

### CP-03: Logout

| Campo | Detalle |
|---|---|
| **Pre-condición** | Usuario logueado |
| **Pasos** | 1. Tocar avatar en toolbar <br> 2. Tocar "Cerrar sesión" |
| **Resultado esperado** | ✅ Redirige a `/login` <br> ✅ No se puede acceder a `/dashboard` directamente |
| **Estado** | ⏳ |

### CP-04: Acceso sin autenticación

| Campo | Detalle |
|---|---|
| **Pre-condición** | No hay sesión activa |
| **Pasos** | 1. Navegar directamente a `/dashboard`, `/recetas`, `/ventas` |
| **Resultado esperado** | ✅ Redirige a `/login` en todos los casos |
| **Estado** | ⏳ |

---

## 2. Ingredientes (Fase 1)

### CP-05: Crear ingrediente

| Campo | Detalle |
|---|---|
| **Pre-condición** | Usuario logueado como owner |
| **Pasos** | 1. Ir a Ingredientes (desde menú o `/ingredientes`) <br> 2. Tocar botón FAB (+) <br> 3. Completar: Nombre="Harina 000", Unidad="kg", Categoría="Secos", Precio=$500, Stock actual=10, Stock mínimo=2 <br> 4. Tocar "Crear" |
| **Resultado esperado** | ✅ Aparece el ingrediente en la lista <br> ✅ Muestra precio `$500,00 / kg` <br> ✅ Stock en verde (10 > 2) |
| **Estado** | ⏳ |

### CP-06: Editar ingrediente — cambio de precio con cascada

| Campo | Detalle |
|---|---|
| **Pre-condición** | Ingrediente "Harina 000" existe y está usado en al menos 1 receta |
| **Pasos** | 1. Tocar card del ingrediente <br> 2. Cambiar precio de $500 a $700 <br> 3. Tocar "Guardar" |
| **Resultado esperado** | ✅ Snackbar dice "Ingrediente actualizado. Recetas recalculadas." <br> ✅ Todas las recetas que usan Harina muestran nuevo costo <br> ✅ Se crea registro en `historialPrecios` |
| **Estado** | ⏳ |

### CP-07: Buscar ingrediente

| Campo | Detalle |
|---|---|
| **Pre-condición** | Existen al menos 3 ingredientes |
| **Pasos** | 1. Escribir "har" en la barra de búsqueda |
| **Resultado esperado** | ✅ Solo se muestran ingredientes cuyo nombre contiene "har" <br> ✅ Al borrar el texto, vuelven todos |
| **Estado** | ⏳ |

### CP-08: Eliminar ingrediente (soft delete)

| Campo | Detalle |
|---|---|
| **Pre-condición** | Ingrediente existente |
| **Pasos** | 1. Tocar card del ingrediente <br> 2. Tocar "Eliminar" en el dialog |
| **Resultado esperado** | ✅ Desaparece de la lista <br> ✅ En Firestore, `activo: false` (no se borra físicamente) |
| **Estado** | ⏳ |

### CP-09: Ver historial de precios

| Campo | Detalle |
|---|---|
| **Pre-condición** | Ingrediente con al menos un cambio de precio |
| **Pasos** | 1. Tocar ícono de reloj (history) en la card del ingrediente |
| **Resultado esperado** | ✅ Se abre dialog con lista de cambios <br> ✅ Muestra precio anterior → nuevo, con fecha <br> ✅ Flecha roja si subió, verde si bajó |
| **Estado** | ⏳ |

---

## 3. Recetas (Fase 1)

### CP-10: Crear receta con cálculo de costo

| Campo | Detalle |
|---|---|
| **Pre-condición** | Existen ingredientes: Harina ($500/kg), Azúcar ($400/kg), Huevos ($200/doc) |
| **Pasos** | 1. Ir a Recetas → FAB (+) <br> 2. Nombre="Torta Básica", Categoría="Tortas", Rendimiento=1 <br> 3. Agregar: Harina 0.5kg, Azúcar 0.3kg, Huevos 1doc <br> 4. Margen=60% <br> 5. Guardar |
| **Resultado esperado** | ✅ Costo calculado = $500×0.5 + $400×0.3 + $200×1 = $570 <br> ✅ Precio sugerido = $570 × 1.6 = $912 <br> ✅ Aparece en la lista con los 3 valores |
| **Estado** | ⏳ |

### CP-11: Duplicar receta

| Campo | Detalle |
|---|---|
| **Pre-condición** | Existe receta "Torta Básica" |
| **Pasos** | 1. Tocar ícono de 3 puntos (⋮) en la card <br> 2. Tocar "Duplicar" |
| **Resultado esperado** | ✅ Aparece nueva receta "Torta Básica (copia)" <br> ✅ Mismos ingredientes, costo y precio que la original |
| **Estado** | ⏳ |

### CP-12: Compartir catálogo

| Campo | Detalle |
|---|---|
| **Pre-condición** | Existen al menos 2 recetas |
| **Pasos** | 1. Tocar botón "Catálogo" en la esquina superior <br> 2. En el dialog, tocar "Compartir" (mobile) o verificar que se copia al portapapeles (desktop) |
| **Resultado esperado** | ✅ En mobile: se abre el panel nativo de compartir con texto del catálogo <br> ✅ En desktop: alerta "Catálogo copiado al portapapeles" <br> ✅ El texto incluye nombre y precio de cada receta |
| **Estado** | ⏳ |

### CP-13: Imprimir catálogo

| Campo | Detalle |
|---|---|
| **Pre-condición** | Existen recetas |
| **Pasos** | 1. Catálogo → tocar ícono de impresora |
| **Resultado esperado** | ✅ Se abre ventana con vista para imprimir limpia <br> ✅ Muestra logo, nombre y lista de productos con precios |
| **Estado** | ⏳ |

---

## 4. Ventas + Stock (Fase 2)

### CP-14: Registrar venta con descuento de stock

| Campo | Detalle |
|---|---|
| **Pre-condición** | Receta "Torta Básica" existe (usa 0.5kg harina, 0.3kg azúcar, 1doc huevos). Ingredientes tienen stock suficiente. |
| **Pasos** | 1. Ir a Ventas → FAB (+) <br> 2. Agregar 2x Torta Básica <br> 3. Seleccionar cliente (opcional) <br> 4. Medio de pago: Efectivo <br> 5. Confirmar |
| **Resultado esperado** | ✅ Venta aparece en pestaña "Pendientes" <br> ✅ Stock de Harina baja 1kg (0.5×2) <br> ✅ Stock de Azúcar baja 0.6kg (0.3×2) <br> ✅ Stock de Huevos baja 2doc (1×2) <br> ✅ Se crean documentos en `movimientosStock` |
| **Estado** | ⏳ |

### CP-15: Marcar venta como entregada

| Campo | Detalle |
|---|---|
| **Pre-condición** | Venta en estado "pendiente" |
| **Pasos** | 1. En pestaña Pendientes, tocar "Entregar ✓" |
| **Resultado esperado** | ✅ Venta pasa a estado "entregado" <br> ✅ Chip cambia a color verde <br> ✅ Desaparece de pestaña Pendientes |
| **Estado** | ⏳ |

### CP-16: Cancelar venta

| Campo | Detalle |
|---|---|
| **Pre-condición** | Venta pendiente |
| **Pasos** | 1. Tocar "Cancelar" en venta pendiente |
| **Resultado esperado** | ✅ Estado cambia a "cancelado" <br> ✅ Chip en rojo <br> ⚠️ **Nota**: El stock NO se repone automáticamente (por diseño) |
| **Estado** | ⏳ |

### CP-17: Buscar en historial de ventas

| Campo | Detalle |
|---|---|
| **Pre-condición** | Existen varias ventas |
| **Pasos** | 1. Ir a pestaña "Historial" <br> 2. Escribir nombre del cliente en búsqueda <br> 3. Seleccionar fecha "Desde" en datepicker |
| **Resultado esperado** | ✅ Se filtran ventas por cliente <br> ✅ Se filtran ventas desde la fecha seleccionada <br> ✅ Ambos filtros funcionan combinados |
| **Estado** | ⏳ |

### CP-18: Enviar pedido por WhatsApp desde ventas

| Campo | Detalle |
|---|---|
| **Pre-condición** | Venta pendiente con cliente que tiene teléfono cargado |
| **Pasos** | 1. Tocar ícono de chat (WhatsApp) en la venta pendiente |
| **Resultado esperado** | ✅ Se abre `wa.me` con número del cliente <br> ✅ Mensaje incluye nombre, detalle de productos, cantidades y total |
| **Estado** | ⏳ |

### CP-19: Stock semáforo

| Campo | Detalle |
|---|---|
| **Pre-condición** | Un ingrediente con stock=0 (rojo), uno con stock≤mínimo (amarillo), uno OK (verde) |
| **Pasos** | 1. Ir a la pestaña Stock |
| **Resultado esperado** | ✅ Ingredientes ordenados: rojo primero, luego amarillo, luego verde <br> ✅ Barras de progreso con colores correctos <br> ✅ Los que están en 0 muestran barra vacía |
| **Estado** | ⏳ |

---

## 5. Clientes (Fase 2)

### CP-20: CRUD completo de clientes

| Campo | Detalle |
|---|---|
| **Pre-condición** | Usuario logueado |
| **Pasos** | 1. Ir a Clientes → FAB (+) <br> 2. Crear: Nombre="María López", Teléfono="5491112345678", Dirección="Av. Siempre Viva 742" <br> 3. Guardar → verificar en lista <br> 4. Tocar para editar → cambiar dirección → guardar <br> 5. Tocar para editar → "Eliminar" |
| **Resultado esperado** | ✅ Cliente aparece en lista después de crear <br> ✅ Muestra teléfono y dirección <br> ✅ Edición actualiza datos <br> ✅ Eliminación lo marca como `[eliminado]` |
| **Estado** | ⏳ |

### CP-21: WhatsApp desde cliente

| Campo | Detalle |
|---|---|
| **Pre-condición** | Cliente con teléfono cargado |
| **Pasos** | 1. Tocar ícono de chat en la card del cliente |
| **Resultado esperado** | ✅ Se abre `wa.me/{telefono}` con saludo personalizado <br> ✅ No abre el formulario de edición (stopPropagation funciona) |
| **Estado** | ⏳ |

### CP-22: Buscar cliente

| Campo | Detalle |
|---|---|
| **Pre-condición** | Existen al menos 3 clientes |
| **Pasos** | 1. Escribir nombre parcial en barra de búsqueda <br> 2. Escribir número de teléfono parcial |
| **Resultado esperado** | ✅ Filtra por nombre <br> ✅ Filtra por teléfono <br> ✅ Búsqueda es case-insensitive |
| **Estado** | ⏳ |

---

## 6. Dashboard (Fase 3)

### CP-23: KPIs con selector de período

| Campo | Detalle |
|---|---|
| **Pre-condición** | Ventas registradas en diferentes días |
| **Pasos** | 1. Ir a Dashboard <br> 2. Selector en "Mes" → anotar valores <br> 3. Cambiar a "Hoy" <br> 4. Cambiar a "Semana" |
| **Resultado esperado** | ✅ Ingresos, ganancia y "más vendido" cambian según período <br> ✅ "Hoy" solo muestra ventas del día actual <br> ✅ "Semana" desde el domingo <br> ✅ "Mes" desde el 1º del mes |
| **Estado** | ⏳ |

### CP-24: Producto más vendido

| Campo | Detalle |
|---|---|
| **Pre-condición** | Múltiples ventas con diferentes productos |
| **Pasos** | 1. Verificar card "Más vendido" en dashboard |
| **Resultado esperado** | ✅ Muestra nombre del producto con más unidades vendidas en el período <br> ✅ Muestra cantidad de unidades <br> ✅ Tiene ícono de trofeo |
| **Estado** | ⏳ |

### CP-25: Gráfico Ingresos vs Costos

| Campo | Detalle |
|---|---|
| **Pre-condición** | Ventas registradas |
| **Pasos** | 1. Verificar sección "Ingresos vs Costos" en dashboard |
| **Resultado esperado** | ✅ Barra verde (ingresos) es mayor que barra roja (costos) si hay ganancia <br> ✅ Valores en ARS al lado de cada barra <br> ✅ Proporciones son correctas |
| **Estado** | ⏳ |

### CP-26: Alertas de stock bajo en dashboard

| Campo | Detalle |
|---|---|
| **Pre-condición** | Al menos un ingrediente con stock ≤ stock mínimo |
| **Pasos** | 1. Verificar sección "Stock bajo" en dashboard |
| **Resultado esperado** | ✅ Lista cada ingrediente bajo con cantidad actual y mínimo <br> ✅ Badge de stock en el bottom nav muestra cantidad |
| **Estado** | ⏳ |

---

## 7. PWA + Offline

### CP-27: Instalación como PWA

| Campo | Detalle |
|---|---|
| **Pre-condición** | App desplegada en HTTPS (Firebase Hosting) |
| **Pasos** | 1. Abrir en Chrome mobile <br> 2. Menú → "Agregar a pantalla de inicio" / banner automático |
| **Resultado esperado** | ✅ Se instala con ícono propio <br> ✅ Se abre sin barra de navegación del browser <br> ✅ Nombre: "Lucis Gestión" |
| **Estado** | ⏳ |

### CP-28: Funcionamiento offline

| Campo | Detalle |
|---|---|
| **Pre-condición** | App cargada previamente con datos sincronizados |
| **Pasos** | 1. Activar modo avión <br> 2. Navegar entre pantallas <br> 3. Registrar una venta |
| **Resultado esperado** | ✅ Datos previamente cargados se muestran <br> ✅ Navegación funciona <br> ✅ Venta se guarda localmente y se sincroniza al volver online |
| **Estado** | ⏳ |

---

## 8. Ciclo completo (E2E)

### CP-29: Ciclo de negocio completo

| Campo | Detalle |
|---|---|
| **Pre-condición** | App vacía, usuario logueado como owner |
| **Pasos** | 1. Crear 3 ingredientes: Harina ($500/kg, stock 10), Azúcar ($400/kg, stock 5), Huevos ($200/doc, stock 6) <br> 2. Crear receta "Torta Chocolate": Harina 0.5kg + Azúcar 0.3kg + Huevos 1doc, margen 60% <br> 3. Crear cliente "Ana García", tel 5491155551234 <br> 4. Registrar venta: 3x Torta Chocolate para Ana, efectivo <br> 5. Verificar stock: Harina=8.5, Azúcar=3.1, Huevos=3 <br> 6. Ir a Dashboard → KPIs en "Hoy" <br> 7. Entregar el pedido <br> 8. Enviar Whatsapp a Ana desde clientes |
| **Resultado esperado** | ✅ Costo receta = $570, precio sugerido = $912 <br> ✅ Venta total = $2,736 (3 × $912) <br> ✅ Stock se descuenta correctamente <br> ✅ Dashboard muestra $2,736 en ingresos del día <br> ✅ "Torta Chocolate" aparece como más vendido <br> ✅ Pedido cambia a entregado <br> ✅ WhatsApp abre con saludo correcto |
| **Estado** | ⏳ |

### CP-30: Verificación de roles — Ayudante

| Campo | Detalle |
|---|---|
| **Pre-condición** | Segundo usuario logueado con rol `ayudante` |
| **Pasos** | 1. Intentar crear/editar ingrediente <br> 2. Intentar crear/editar receta <br> 3. Registrar una venta <br> 4. Crear un cliente nuevo |
| **Resultado esperado** | ⚠️ Con las Firestore rules actuales: <br> ✅ Puede leer ingredientes y recetas <br> ❌ No puede crear/editar ingredientes ni recetas (Firestore reject) <br> ✅ Puede crear ventas y clientes <br> 🔍 **Nota**: La UI no esconde botones todavía — el ayudante verá los formularios pero Firestore rechazará el write |
| **Estado** | ⏳ |

---

## Checklist rápido de ejecución

| # | Caso | Estado |
|---|---|---|
| CP-01 | Login primer usuario (owner) | ⏳ |
| CP-02 | Login segundo usuario (ayudante) | ⏳ |
| CP-03 | Logout | ⏳ |
| CP-04 | Acceso sin auth | ⏳ |
| CP-05 | Crear ingrediente | ⏳ |
| CP-06 | Editar ingrediente + cascada | ⏳ |
| CP-07 | Buscar ingrediente | ⏳ |
| CP-08 | Eliminar ingrediente | ⏳ |
| CP-09 | Historial de precios | ⏳ |
| CP-10 | Crear receta + cálculo | ⏳ |
| CP-11 | Duplicar receta | ⏳ |
| CP-12 | Compartir catálogo | ⏳ |
| CP-13 | Imprimir catálogo | ⏳ |
| CP-14 | Venta + descuento stock | ⏳ |
| CP-15 | Marcar entregada | ⏳ |
| CP-16 | Cancelar venta | ⏳ |
| CP-17 | Buscar historial ventas | ⏳ |
| CP-18 | WhatsApp desde venta | ⏳ |
| CP-19 | Stock semáforo | ⏳ |
| CP-20 | CRUD clientes | ⏳ |
| CP-21 | WhatsApp desde cliente | ⏳ |
| CP-22 | Buscar cliente | ⏳ |
| CP-23 | KPIs + período | ⏳ |
| CP-24 | Producto más vendido | ⏳ |
| CP-25 | Ingresos vs Costos | ⏳ |
| CP-26 | Alertas stock bajo | ⏳ |
| CP-27 | PWA instalación | ⏳ |
| CP-28 | Modo offline | ⏳ |
| CP-29 | Ciclo E2E completo | ⏳ |
| CP-30 | Verificación roles ayudante | ⏳ |
