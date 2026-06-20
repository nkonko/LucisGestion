# Lucis Gestión

Lucis Gestión is a production-ready web application for managing a small handmade bakery or pastry business. It centralizes recipes, ingredient costs, inventory, sales, customers, fixed costs, and financial indicators in a single responsive PWA.

The project was developed as a Final Master's Project (TFM) and is intended to be reviewed through the public deployment and the built-in demo mode, which allows evaluators to explore the application without creating an account or configuring Firebase.

## Live Deployment

- **Production URL:** <https://lucis-gestion-6cea2.web.app/>
- **Recommended evaluator access:** <https://lucis-gestion-6cea2.web.app/demo>
- **Demo mode credentials:** no username or password required. The demo route auto-authenticates an in-memory owner user and loads sample business data.
- **Real login:** Google authentication is available from the production application for real Firebase-backed usage.

## Project Overview

Lucis Gestión solves common operational problems for an artisanal bakery:

- knowing the real cost of each recipe based on ingredient prices;
- keeping inventory up to date after sales;
- tracking pending and delivered orders;
- managing customers and WhatsApp communication;
- monitoring revenue, costs, profit, low stock, best-selling products, and customer relevance;
- exporting reports and maintaining backup/restore workflows.

The application supports two execution modes:

1. **Firebase mode:** real Google login, Firestore persistence, Firebase Hosting deployment, and production PWA behavior.
2. **Demo/mock mode:** no login and no Firebase dependency; data is stored in memory and reset when the browser refreshes.

## Technology Stack

| Area | Technology |
|---|---|
| Frontend framework | Angular 22 with standalone components |
| State management | Angular signals and NgRx Signals |
| Styling | Tailwind CSS 4 and custom SCSS components |
| Backend as a service | Firebase Authentication and Cloud Firestore |
| Hosting | Firebase Hosting |
| PWA | Angular service worker and Web App Manifest |
| Testing | Vitest, Angular testing utilities, jsdom, Playwright-based screenshot tooling |
| Reports | jsPDF, jsPDF AutoTable, ExcelJS |
| Tooling | PNPM, Angular CLI, ESLint, Prettier, TypeScript |

## Requirements

| Tool | Minimum / expected version |
|---|---|
| Node.js | `>=22.22.3` |
| pnpm | `11.1.1` or compatible |
| Angular CLI | Angular CLI compatible with Angular 22 |
| Firebase CLI | Required only for deployment |

## Installation

```bash
pnpm install
```

## Running the Application

### Recommended local review: demo mode

```bash
pnpm start:mock
```

Open <http://localhost:4200/demo>. This mode replaces Firebase services with in-memory services and starts with sample ingredients, recipes, customers, sales, fixed costs, and stock data.

### Firebase-backed development mode

```bash
pnpm start
```

Open <http://localhost:4200>. This mode requires valid Firebase configuration in `src/environments/environment.ts`.

## Main Commands

| Command | Description |
|---|---|
| `pnpm start` | Runs the Firebase-backed development server |
| `pnpm start:mock` | Runs the app with mock data and no login requirement |
| `pnpm build` | Builds the production application |
| `pnpm build:mock` | Builds the mock/demo configuration |
| `pnpm test` | Runs the unit test suite with Vitest |
| `pnpm test:mock` | Runs the mock-mode verification script |
| `pnpm lint` | Runs ESLint |
| `pnpm screenshot:mock` | Starts mock mode and captures a screenshot when Playwright browsers are available |
| `pnpm release` | Creates the release/deployment bundle |

## Project Structure

```text
src/app/
├── core/
│   ├── guards/              # Authentication, demo, guest, and owner route guards
│   ├── models/              # Domain models for ingredients, recipes, sales, reports, users, etc.
│   ├── services/            # Firebase services, mock services, dashboard metrics, stock, sales, notifications
│   └── store/               # NgRx Signal stores and shared state definitions
├── features/
│   ├── backup-restore/      # Data export/import and recovery workflows
│   ├── customers/           # Customer CRUD and WhatsApp contact actions
│   ├── dashboard/           # Business KPIs, period filters, and operational alerts
│   ├── financial-reports/   # Financial insights, PDF/Excel exports, recommendations, top customers/products
│   ├── fixed-costs/         # Monthly fixed cost registration and analysis
│   ├── ingredients/         # Ingredient CRUD, prices, units, categories, and price history
│   ├── landing/             # Public marketing/entry page
│   ├── login/               # Google sign-in screen
│   ├── recipes/             # Recipe CRUD, cost calculation, categories, catalog sharing/printing
│   ├── sales/               # Sales registration, pending orders, history, payment methods, WhatsApp messages
│   └── stock/               # Inventory status, low-stock indicators, and stock movements
├── shared/
│   ├── bottom-nav/          # Mobile-first navigation
│   ├── layout/              # Authenticated application shell
│   ├── pipes/               # ARS currency formatting
│   ├── ui/                  # Reusable UI primitives
│   └── ui-bottom-sheet/     # Bottom sheet and confirmation dialog infrastructure
└── environments/            # Runtime environment configuration
```

## Main Features

### 1. Dashboard and Business KPIs

- Revenue, cost, net profit, and best-selling product indicators.
- Period filters for daily, weekly, and monthly analysis.
- Low-stock alerts connected to the inventory module.

### 2. Ingredient and Price Management

- Ingredient CRUD with measurement units, categories, current stock, minimum stock, and purchase prices.
- Price history tracking when ingredient prices change.
- Automatic recipe cost recalculation after price changes.

### 3. Recipes and Catalog

- Recipe creation with ingredient quantities, yield, margin, real cost, and suggested price.
- Recipe duplication for faster product creation.
- Shareable and printable product catalog.

### 4. Sales and Stock Control

- Sales registration with one or more products.
- Automatic ingredient stock deduction based on recipe quantities.
- Pending, delivered, and cancelled order states.
- WhatsApp message generation for customer communication.

### 5. Customers

- Customer creation, update, search, and soft delete.
- Phone and address management.
- Direct WhatsApp contact from customer cards.

### 6. Financial Reports

- Revenue, cost, and profit analysis.
- Top products and top customers.
- Low-stock report and recommendations.
- PDF and Excel export support.

### 7. Fixed Costs

- Monthly fixed cost registration.
- Cost categories and period-based tracking.
- Integration with financial analysis.

### 8. Backup and Restore

- Data export/import workflows intended for owners.
- Useful for operational recovery and academic demonstration of data portability.

## Demo Data and Test Access

For TFM review, use the demo mode:

- **URL:** <https://lucis-gestion-6cea2.web.app/demo>
- **User:** not required
- **Password:** not required
- **Role:** owner in demo mode
- **Persistence:** in-memory only; changes are reset after refreshing or restarting the app

The demo dataset includes representative ingredients, recipes, customers, sales, fixed costs, stock levels, and financial indicators so the evaluator can validate the core workflow without account setup.

## Deployment Information

The application is deployed on Firebase Hosting:

```text
https://lucis-gestion-6cea2.web.app/
```

The Firebase deployment includes:

- Angular production build;
- SPA hosting rewrite to `index.html`;
- Firestore security rules;
- Firestore indexes;
- PWA assets.

Detailed deployment steps are documented in [`read first/GUIA-DESPLIEGUE.md`](read%20first/GUIA-DESPLIEGUE.md).

## TFM Delivery Resources

| Resource | Location |
|---|---|
| Main documentation | [`README.md`](README.md) |
| Deployment guide | [`read first/GUIA-DESPLIEGUE.md`](read%20first/GUIA-DESPLIEGUE.md) |
| Manual test cases | [`read first/MANUAL-CASOS-DE-PRUEBA.md`](read%20first/MANUAL-CASOS-DE-PRUEBA.md) |
| Slide deck content | [`docs/presentation/TFM-SLIDES.md`](docs/presentation/TFM-SLIDES.md) |
| Video script | [`docs/video/TFM-VIDEO-SCRIPT.md`](docs/video/TFM-VIDEO-SCRIPT.md) |

## Suggested Evaluation Flow

1. Open <https://lucis-gestion-6cea2.web.app/demo>.
2. Review the dashboard KPIs and low-stock alerts.
3. Open Ingredients and review stock/prices.
4. Open Recipes and verify calculated costs and suggested prices.
5. Register a new sale and confirm that stock is updated.
6. Mark the sale as delivered.
7. Open Customers and test WhatsApp contact actions.
8. Open Financial Reports and export a report if needed.
9. Review the manual test cases for a structured validation path.

## Additional Documentation

- [`read first/GUIA-DESPLIEGUE.md`](read%20first/GUIA-DESPLIEGUE.md) — Firebase deployment and production configuration guide.
- [`read first/MANUAL-CASOS-DE-PRUEBA.md`](read%20first/MANUAL-CASOS-DE-PRUEBA.md) — Functional test manual with expected results.
- [`docs/presentation/TFM-SLIDES.md`](docs/presentation/TFM-SLIDES.md) — Slide-by-slide content and generation prompt.
- [`docs/video/TFM-VIDEO-SCRIPT.md`](docs/video/TFM-VIDEO-SCRIPT.md) — Narration script for the required screen-recorded video.
