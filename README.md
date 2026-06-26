# Lucis Gestión

[![E2E Playwright](https://github.com/nkonko/LucisGestion/actions/workflows/e2e.yml/badge.svg)](https://github.com/nkonko/LucisGestion/actions/workflows/e2e.yml)

Sistema de gestión para pastelería artesanal. Permite administrar ingredientes, recetas con costeo automático, ventas con control de stock, clientes y dashboard de métricas.

## Tech Stack

- **Angular 21** (standalone components, signals, OnPush)
- **UI propia Tailwind CSS 4
- **NgRx Signals** (store reactivo)
- **Firebase** (Auth, Firestore, Hosting)
- **PWA** (Service Worker, offline support)

## Requisitos

| Herramienta | Versión mínima |
|---|---|
| Node.js | 20+ |
| pnpm | 10+ |
| Angular CLI | 21+ |

## Instalación

```bash
pnpm install
```

## Comandos

| Comando | Descripción |
|---|---|
| `pnpm start` | Servidor de desarrollo (requiere Firebase configurado) |
| `pnpm start:mock` | **Servidor con datos de prueba** (sin Firebase, sin login) |
| `pnpm build` | Build de producción |
| `pnpm test` | Tests unitarios con Vitest |
| `pnpm e2e` | Tests E2E con Playwright |

## Modo Mock (demo sin Firebase)

Para levantar la app sin necesidad de Firebase ni conexión a internet:

```bash
pnpm start:mock
```

Esto reemplaza los servicios de Firebase por implementaciones en memoria con datos de ejemplo preconfigurados:
- 10 ingredientes con stock y precios
- 4 recetas con costeo calculado
- 4 clientes
- 5 ventas (pendientes y entregadas)

El usuario queda auto-logueado como "owner". Todas las operaciones CRUD funcionan en memoria (los datos se pierden al refrescar la página).

**Ideal para**: demos, evaluación de la app, pruebas de UI sin dependencias externas.

## Estructura del proyecto

```
src/app/
├── core/
│   ├── guards/         # Auth guard
│   ├── models/         # Interfaces y tipos del dominio
│   ├── services/       # FirestoreService, AuthService + mocks
│   └── store/          # PasteleriaStore (NgRx Signals)
├── features/
│   ├── clientes/       # ABM de clientes
│   ├── dashboard/      # KPIs, gráficos, alertas
│   ├── ingredientes/   # ABM + historial de precios
│   ├── login/          # Login con Google
│   ├── recetas/        # ABM + costeo + catálogo
│   ├── stock/          # Vista semáforo de stock
│   └── ventas/         # Registro de ventas + historial
└── shared/
    ├── layout/         # Shell con top toolbar y bottom nav
    └── pipes/          # Pipe ARS (formato moneda)
```

## Nota de UI

La UI se basa en componentes/primitivas propias y set SVG local.

## Documentación adicional

- [`read first/GUIA-DESPLIEGUE.md`](read%20first/GUIA-DESPLIEGUE.md) — Guía paso a paso para desplegar en Firebase
- [`read first/MANUAL-CASOS-DE-PRUEBA.md`](read%20first/MANUAL-CASOS-DE-PRUEBA.md) — 30 casos de prueba funcionales
