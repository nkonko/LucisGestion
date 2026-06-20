# TFM Video Script — Lucis Gestión

This script is designed for a screen-recorded explanation of the project. The recommended duration is 6 to 8 minutes.

## Recording Setup

- Open the deployed demo before starting: <https://lucis-gestion-6cea2.web.app/demo>
- Record the full browser window.
- Optional: include webcam overlay.
- Keep the README open in another tab to show documentation and delivery resources.
- At the end, paste the final public video URL in the README or in the delivery platform.

## 0:00 — Introduction

Hello, my name is [your name], and this is the presentation of my Final Master's Project: Lucis Gestión.

Lucis Gestión is a web application designed for a small handmade bakery or pastry business. Its goal is to centralize recipe costing, ingredient stock, sales, customer management, fixed costs, and financial reporting in one responsive application.

For this review I will use the public demo mode, which does not require username or password.

## 0:45 — Access and Demo Mode

On screen, I open the deployed application at:

<https://lucis-gestion-6cea2.web.app/demo>

This route automatically starts the application as an owner user and loads sample data. The reviewer can safely test the system because demo data is stored in memory and resets after refreshing the browser.

## 1:20 — Dashboard Overview

This is the dashboard. It summarizes the current business situation with key performance indicators such as revenue, costs, net profit, and best-selling products.

The dashboard also includes low-stock alerts, so the owner can quickly detect which ingredients need to be purchased. The period filters allow the user to review information for different time ranges, such as today, week, or month.

## 2:00 — Ingredients and Stock

Now I open the Ingredients section. Here the user can create and manage the ingredients used by the bakery.

Each ingredient stores its measurement unit, price, current stock, minimum stock, and category. This information is essential because recipe costs are calculated from ingredient prices.

When prices change, the system keeps a price history and can update recipe cost calculations. This helps the business keep selling prices aligned with real production costs.

Next, I open the Stock section. The application displays stock status with visual indicators, making it easy to identify critical, low, and healthy inventory levels.

## 3:00 — Recipes and Cost Calculation

Now I open Recipes. A recipe is built from ingredients and quantities. The application calculates the total production cost and then applies a margin to suggest a sale price.

This feature is one of the core parts of the project because it solves a common business problem: knowing whether a product is profitable after ingredient price changes.

The recipe module also supports duplication and catalog sharing or printing, which helps the owner quickly create product variations and communicate products to customers.

## 4:00 — Sales Flow

Now I open Sales. Here the user can register an order, select one or more recipes, assign a customer, choose a payment method, and confirm the sale.

When a sale is registered, the system deducts the required ingredients from stock according to each recipe. Sales can be pending, delivered, or cancelled, which reflects the operational status of customer orders.

The application also includes WhatsApp actions to help contact customers with order information.

## 5:00 — Customers and Communication

In the Customers section, the user can create, edit, search, and delete customer records. Each customer can include a phone number and address.

The WhatsApp shortcut is useful for a small business because many orders are coordinated directly through messaging. The system reduces manual work by preparing communication actions from stored customer data.

## 5:40 — Financial Reports and Fixed Costs

Next, I open the Financial Reports area. This section provides a more analytical view of the business, including financial indicators, top products, top customers, low-stock information, and recommendations.

The application also supports exports to PDF and Excel. This is important because it allows the owner to keep external records or share reports.

Fixed costs can also be registered, which gives a more complete view of profitability beyond variable ingredient costs.

## 6:40 — Technical Overview

Technically, Lucis Gestión is built with Angular 22 using standalone components, Angular signals, and NgRx Signals for reactive state management.

Firebase is used for authentication, Firestore persistence, and hosting. The project also includes a mock mode, where Firebase services are replaced by in-memory implementations for demonstration and testing.

The repository includes documentation, a deployment guide, a functional test case manual, slide content, and this video script.

## 7:25 — Closing

To conclude, Lucis Gestión covers the full operational cycle of a small bakery: ingredients, recipes, prices, stock, sales, customers, dashboard metrics, financial reports, and deployment.

The public demo route allows the evaluator to test the project immediately without credentials:

<https://lucis-gestion-6cea2.web.app/demo>

Thank you for watching the presentation.

## Short Checklist While Recording

1. Show the demo URL.
2. Show dashboard KPIs.
3. Show ingredients and stock.
4. Show recipe costing.
5. Register or inspect a sale.
6. Show customers and WhatsApp action.
7. Show reports/export area.
8. Show README delivery resources.
