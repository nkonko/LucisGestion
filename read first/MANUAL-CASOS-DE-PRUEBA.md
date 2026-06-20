# Functional Test Case Manual — Lucis Gestión

This manual defines the functional checks for the TFM review of Lucis Gestión. The recommended review mode is the public demo route because it avoids account creation and includes representative sample data.

## Recommended Test Access

- **Public deployment:** <https://lucis-gestion-6cea2.web.app/>
- **Demo route:** <https://lucis-gestion-6cea2.web.app/demo>
- **Local demo command:** `pnpm start:mock`
- **Demo credentials:** none required
- **Demo role:** owner
- **Persistence:** in-memory; changes reset after refresh/restart

## Conventions

- **Precondition:** Required state before executing the case.
- **Steps:** Ordered actions.
- **Expected result:** Observable result if the feature works correctly.
- **Status:** Pending until executed by the evaluator.

## Authentication and Access

### TC-01: Demo access without login

| Field | Detail |
|---|---|
| Precondition | Application deployed or running with `pnpm start:mock` |
| Steps | 1. Open `/demo` or `/demo/dashboard` |
| Expected result | The app opens the authenticated layout with sample data and no login prompt. |
| Status | Pending |

### TC-02: Google login for Firebase mode

| Field | Detail |
|---|---|
| Precondition | Firebase Authentication configured with Google provider |
| Steps | 1. Open `/login` 2. Click Google login 3. Select account |
| Expected result | The user is authenticated and redirected to `/app/dashboard`. First user receives owner permissions. |
| Status | Pending |

### TC-03: Logout

| Field | Detail |
|---|---|
| Precondition | User authenticated in Firebase mode |
| Steps | 1. Open the user menu 2. Click logout |
| Expected result | Session closes and protected `/app/*` routes require authentication again. |
| Status | Pending |

### TC-04: Protected route access

| Field | Detail |
|---|---|
| Precondition | No Firebase session is active |
| Steps | 1. Navigate directly to `/app/dashboard`, `/app/recetas`, and `/app/ventas` |
| Expected result | The app redirects unauthenticated users to login. |
| Status | Pending |

## Ingredients and Price History

### TC-05: Create ingredient

| Field | Detail |
|---|---|
| Precondition | Demo or owner user active |
| Steps | 1. Open Ingredients 2. Add an ingredient 3. Fill name, unit, category, price, current stock, and minimum stock 4. Save |
| Expected result | The ingredient appears in the list with formatted price and stock status. |
| Status | Pending |

### TC-06: Edit ingredient price

| Field | Detail |
|---|---|
| Precondition | Ingredient used by at least one recipe exists |
| Steps | 1. Edit ingredient 2. Change price 3. Save |
| Expected result | The ingredient price updates, related recipe costs are recalculated, and price history records the change. |
| Status | Pending |

### TC-07: Search ingredient

| Field | Detail |
|---|---|
| Precondition | Multiple ingredients exist |
| Steps | 1. Type a partial ingredient name in the search field |
| Expected result | The list filters case-insensitively and restores all items when the search is cleared. |
| Status | Pending |

### TC-08: Delete ingredient

| Field | Detail |
|---|---|
| Precondition | Ingredient exists |
| Steps | 1. Open ingredient details 2. Delete 3. Confirm |
| Expected result | Ingredient disappears from active lists and remains soft-deleted in persisted mode. |
| Status | Pending |

### TC-09: Review price history

| Field | Detail |
|---|---|
| Precondition | Ingredient has at least one price change |
| Steps | 1. Open the ingredient price history action |
| Expected result | A history view displays previous price, new price, date, and change direction. |
| Status | Pending |

## Recipes and Catalog

### TC-10: Create recipe with cost calculation

| Field | Detail |
|---|---|
| Precondition | Ingredients with prices exist |
| Steps | 1. Open Recipes 2. Add recipe 3. Add ingredients and quantities 4. Set margin 5. Save |
| Expected result | Total cost and suggested price are calculated from ingredient prices and margin. |
| Status | Pending |

### TC-11: Duplicate recipe

| Field | Detail |
|---|---|
| Precondition | At least one recipe exists |
| Steps | 1. Open recipe actions 2. Duplicate recipe |
| Expected result | A copy appears with the same ingredients, cost, and suggested price. |
| Status | Pending |

### TC-12: Share catalog

| Field | Detail |
|---|---|
| Precondition | At least two recipes exist |
| Steps | 1. Open catalog 2. Use the share/copy action |
| Expected result | Mobile opens native share when available; desktop copies catalog text to clipboard. |
| Status | Pending |

### TC-13: Print catalog

| Field | Detail |
|---|---|
| Precondition | Recipes exist |
| Steps | 1. Open catalog 2. Click print |
| Expected result | A clean print view opens with product names and prices. |
| Status | Pending |

## Sales and Inventory

### TC-14: Register sale and deduct stock

| Field | Detail |
|---|---|
| Precondition | Recipe and ingredient stock are available |
| Steps | 1. Open Sales 2. Create sale 3. Add recipe quantities 4. Select payment method 5. Confirm |
| Expected result | Sale appears as pending and required ingredient stock is deducted according to recipe quantities. |
| Status | Pending |

### TC-15: Mark sale as delivered

| Field | Detail |
|---|---|
| Precondition | Pending sale exists |
| Steps | 1. Click deliver/complete action |
| Expected result | Sale status changes to delivered and it leaves the pending list. |
| Status | Pending |

### TC-16: Cancel sale

| Field | Detail |
|---|---|
| Precondition | Pending sale exists |
| Steps | 1. Click cancel 2. Confirm |
| Expected result | Sale status changes to cancelled. Stock is not automatically restored unless explicitly implemented by business rules. |
| Status | Pending |

### TC-17: Search sales history

| Field | Detail |
|---|---|
| Precondition | Several sales exist |
| Steps | 1. Open sales history 2. Search by customer or filter by date |
| Expected result | Sales list reflects the search and date filters. |
| Status | Pending |

### TC-18: Send sale message by WhatsApp

| Field | Detail |
|---|---|
| Precondition | Sale has a customer with phone number |
| Steps | 1. Click the WhatsApp action on the sale |
| Expected result | A `wa.me` URL opens with customer phone and generated order details. |
| Status | Pending |

### TC-19: Stock traffic-light view

| Field | Detail |
|---|---|
| Precondition | Ingredients have different stock levels |
| Steps | 1. Open Stock |
| Expected result | Out-of-stock, low-stock, and healthy-stock ingredients are visually differentiated and prioritized. |
| Status | Pending |

## Customers

### TC-20: Customer CRUD

| Field | Detail |
|---|---|
| Precondition | Demo or authenticated user active |
| Steps | 1. Open Customers 2. Create customer 3. Edit address or phone 4. Delete customer |
| Expected result | Customer list reflects create, update, and soft-delete operations. |
| Status | Pending |

### TC-21: WhatsApp from customer card

| Field | Detail |
|---|---|
| Precondition | Customer has phone number |
| Steps | 1. Click WhatsApp action on customer card |
| Expected result | A `wa.me` URL opens without triggering the edit form. |
| Status | Pending |

### TC-22: Search customer

| Field | Detail |
|---|---|
| Precondition | Multiple customers exist |
| Steps | 1. Search by partial name 2. Search by partial phone |
| Expected result | Customer list filters case-insensitively by name or phone. |
| Status | Pending |

## Dashboard and Reports

### TC-23: KPI period selector

| Field | Detail |
|---|---|
| Precondition | Sales exist in the selected period |
| Steps | 1. Open Dashboard 2. Change between day, week, and month filters |
| Expected result | Revenue, cost, profit, and best-selling product update according to the selected period. |
| Status | Pending |

### TC-24: Best-selling product

| Field | Detail |
|---|---|
| Precondition | Sales contain different products |
| Steps | 1. Review the best-selling product card |
| Expected result | The card displays the product with the highest quantity sold in the period. |
| Status | Pending |

### TC-25: Revenue versus cost visualization

| Field | Detail |
|---|---|
| Precondition | Delivered or registered sales exist |
| Steps | 1. Review dashboard financial comparison |
| Expected result | Income and cost values are formatted in ARS and represented proportionally. |
| Status | Pending |

### TC-26: Low-stock dashboard alert

| Field | Detail |
|---|---|
| Precondition | At least one ingredient is at or below minimum stock |
| Steps | 1. Open Dashboard |
| Expected result | Low-stock ingredients are listed with current and minimum quantities. |
| Status | Pending |

### TC-27: Financial report export

| Field | Detail |
|---|---|
| Precondition | Financial report data is available |
| Steps | 1. Open Financial Reports 2. Generate PDF or Excel export |
| Expected result | A report file is generated with KPIs, top products/customers, and insights. |
| Status | Pending |

### TC-28: Fixed costs

| Field | Detail |
|---|---|
| Precondition | Demo or owner user active |
| Steps | 1. Open Fixed Costs 2. Register a monthly fixed cost 3. Review the list |
| Expected result | The cost is stored and included in the monthly financial context. |
| Status | Pending |

## PWA and Deployment

### TC-29: PWA installation

| Field | Detail |
|---|---|
| Precondition | App is opened through HTTPS deployment |
| Steps | 1. Open in Chrome 2. Use install/add-to-home-screen option |
| Expected result | The app installs with its manifest name and icon. |
| Status | Pending |

### TC-30: Direct deployed route refresh

| Field | Detail |
|---|---|
| Precondition | Application deployed to Firebase Hosting |
| Steps | 1. Open `/demo/dashboard` directly 2. Refresh browser |
| Expected result | Firebase Hosting rewrites to the Angular app and the route loads correctly. |
| Status | Pending |

## End-to-end Business Flow

### TC-31: Complete bakery workflow

| Field | Detail |
|---|---|
| Precondition | Demo mode active |
| Steps | 1. Review ingredients 2. Create or inspect recipe cost 3. Create customer 4. Register sale 5. Verify stock 6. Deliver order 7. Review dashboard 8. Export report |
| Expected result | The application supports the complete operational cycle from production data to sale and reporting. |
| Status | Pending |

## Quick Execution Checklist

| ID | Test case | Status |
|---|---|---|
| TC-01 | Demo access without login | Pending |
| TC-02 | Google login for Firebase mode | Pending |
| TC-03 | Logout | Pending |
| TC-04 | Protected route access | Pending |
| TC-05 | Create ingredient | Pending |
| TC-06 | Edit ingredient price | Pending |
| TC-07 | Search ingredient | Pending |
| TC-08 | Delete ingredient | Pending |
| TC-09 | Review price history | Pending |
| TC-10 | Create recipe with cost calculation | Pending |
| TC-11 | Duplicate recipe | Pending |
| TC-12 | Share catalog | Pending |
| TC-13 | Print catalog | Pending |
| TC-14 | Register sale and deduct stock | Pending |
| TC-15 | Mark sale as delivered | Pending |
| TC-16 | Cancel sale | Pending |
| TC-17 | Search sales history | Pending |
| TC-18 | Send sale message by WhatsApp | Pending |
| TC-19 | Stock traffic-light view | Pending |
| TC-20 | Customer CRUD | Pending |
| TC-21 | WhatsApp from customer card | Pending |
| TC-22 | Search customer | Pending |
| TC-23 | KPI period selector | Pending |
| TC-24 | Best-selling product | Pending |
| TC-25 | Revenue versus cost visualization | Pending |
| TC-26 | Low-stock dashboard alert | Pending |
| TC-27 | Financial report export | Pending |
| TC-28 | Fixed costs | Pending |
| TC-29 | PWA installation | Pending |
| TC-30 | Direct deployed route refresh | Pending |
| TC-31 | Complete bakery workflow | Pending |
