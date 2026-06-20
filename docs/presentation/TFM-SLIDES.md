# TFM Slide Deck — Lucis Gestión

This document can be submitted as the slide resource or used as a source script to create Google Slides, PowerPoint, Canva, or Gamma slides.

## Public Links to Include

- Application: <https://lucis-gestion-6cea2.web.app/>
- Demo: <https://lucis-gestion-6cea2.web.app/demo>
- Documentation: `README.md`
- Video: add the final public YouTube/Drive URL here after recording.

## Visual Assets

Use the existing project images as screenshots or visual references:

- `public/images/landing/dashboard-preview.svg`
- `public/images/landing/inventory-showcase.svg`
- `public/images/landing/analytics-showcase.svg`
- `public/images/landing/operations-showcase.svg`

If you can capture live screenshots, use the demo route and include:

1. Dashboard KPIs.
2. Recipe cost screen.
3. Sales/order flow.
4. Stock traffic-light view.
5. Financial reports/export screen.

## Slide 1 — Title

**Title:** Lucis Gestión  
**Subtitle:** Bakery management web application for recipes, stock, sales, customers, and financial reporting  
**Footer:** Final Master's Project — TFM

**Suggested visual:** landing or dashboard preview.

## Slide 2 — Problem and Motivation

**Key message:** Small handmade bakery businesses often manage prices, stock, and orders manually, which creates errors and makes profitability hard to understand.

**Bullets:**

- Ingredient prices change frequently.
- Recipe profitability depends on exact costs and margins.
- Sales should automatically affect inventory.
- Owners need simple KPIs, reports, and customer communication.

## Slide 3 — Proposed Solution

**Key message:** Lucis Gestión centralizes the operational cycle in a responsive PWA.

**Bullets:**

- Recipe costing with suggested prices.
- Ingredient inventory with low-stock alerts.
- Sales registration and order status tracking.
- Customer management and WhatsApp actions.
- Financial dashboard, reports, and exports.
- Demo mode for evaluation without login.

## Slide 4 — Target Users and Scope

**Bullets:**

- Primary user: owner of a small bakery or pastry business.
- Secondary user: assistant who supports daily operations.
- Scope: inventory, recipes, sales, customers, fixed costs, reporting, backup/restore.
- Out of scope: online payments, marketplace checkout, and logistics integrations.

## Slide 5 — Technology Stack

**Bullets:**

- Angular 22 with standalone components.
- Angular signals and NgRx Signals for reactive state.
- Firebase Authentication, Firestore, and Hosting.
- Tailwind CSS 4 and custom UI primitives.
- Vitest, ESLint, Playwright tooling.
- jsPDF and ExcelJS for exports.

**Suggested visual:** architecture diagram with Angular frontend, Firebase backend, and browser/PWA users.

## Slide 6 — Architecture

**Bullets:**

- `features/`: business screens such as dashboard, ingredients, recipes, sales, reports.
- `core/`: guards, services, stores, and domain models.
- `shared/`: reusable layout, navigation, UI components, and pipes.
- Firebase-backed mode for production.
- Mock mode for demos and deterministic review.

## Slide 7 — Main Workflow

**Flow:**

1. Create ingredients with price and stock.
2. Build recipes using ingredient quantities.
3. Calculate cost and suggested selling price.
4. Register sales.
5. Deduct stock automatically.
6. Monitor dashboard and financial reports.

**Suggested visual:** numbered process diagram.

## Slide 8 — Demo Mode

**Bullets:**

- URL: <https://lucis-gestion-6cea2.web.app/demo>
- No credentials required.
- Auto-authenticated as owner.
- Includes sample ingredients, recipes, customers, sales, stock, and costs.
- Safe for evaluators because changes are temporary.

**Suggested visual:** screenshot of dashboard in demo mode.

## Slide 9 — Key Feature: Recipe Costing

**Bullets:**

- Recipes are composed from real ingredients.
- Cost is calculated from current ingredient prices and quantities.
- Margin produces a suggested sale price.
- Price changes can recalculate affected recipes.

**Suggested visual:** recipe form or recipe list.

## Slide 10 — Key Feature: Sales and Stock

**Bullets:**

- Sales support multiple products.
- Orders can be pending, delivered, or cancelled.
- Confirmed sales deduct ingredient stock.
- WhatsApp messages help communicate order details.

**Suggested visual:** sales screen or order card.

## Slide 11 — Key Feature: Dashboard and Reports

**Bullets:**

- Revenue, cost, net profit, and best-selling product.
- Daily, weekly, and monthly period filtering.
- Low-stock alerts.
- Financial reports with PDF and Excel exports.

**Suggested visual:** analytics showcase or financial reports screen.

## Slide 12 — Deployment and Quality

**Bullets:**

- Deployed with Firebase Hosting.
- Firestore rules and indexes are versioned in the repository.
- PWA-ready application shell.
- Functional test manual included.
- Unit tests and lint/build commands available through PNPM.

## Slide 13 — TFM Review Resources

**Bullets:**

- Documentation: `README.md`.
- Deployment guide: `read first/GUIA-DESPLIEGUE.md`.
- Test manual: `read first/MANUAL-CASOS-DE-PRUEBA.md`.
- Slides: `docs/presentation/TFM-SLIDES.md`.
- Video script: `docs/video/TFM-VIDEO-SCRIPT.md`.

## Slide 14 — Conclusions and Future Work

**Bullets:**

- Lucis Gestión covers the complete operational workflow for a small bakery.
- Demo mode makes evaluation frictionless.
- Firebase provides a practical production deployment path.
- Future improvements: advanced role-based UI hiding, richer analytics, online ordering, payment integration, and automated E2E coverage.

## Prompt to Generate a Visual Presentation Later

Use this prompt in Google Slides AI, Canva, Gamma, Tome, PowerPoint Copilot, or another slide generator:

```text
Create a professional 14-slide English presentation for a Final Master's Project called "Lucis Gestión". It is an Angular 22 and Firebase web/PWA application for managing an artisanal bakery. Use a modern, clean, warm bakery-inspired visual style with soft beige, cream, chocolate, and accent green colors. Include these slides: title; problem and motivation; proposed solution; target users and scope; technology stack; architecture; main workflow; demo mode with URL https://lucis-gestion-6cea2.web.app/demo; recipe costing; sales and stock; dashboard and financial reports; deployment and quality; TFM review resources; conclusions and future work. Mention that demo mode requires no credentials and uses temporary in-memory sample data. Leave image placeholders for dashboard, recipe costing, sales flow, stock view, and financial reports. Use concise bullets and speaker notes for a 7-minute presentation.
```
