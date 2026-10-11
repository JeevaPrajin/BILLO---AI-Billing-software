# Billo

Billo is a lightweight, offline-first point-of-sale and credit-ledger app
built for small kirana shop owners and street vendors. It replaces the
single paper notebook most vendors currently use to track sales and
customer credit ("udhaar") with a fast, tap-based digital alternative — no
backend, no login, no internet dependency for core billing.

## Problem

Vendors currently track daily sales and customer credit in a single paper
notebook: no backup, manual/mental-math billing, and no warning before a
product runs out of stock. Billo digitizes this workflow without changing
how vendors actually work — same speed, same trust-based credit model,
just backed by a phone instead of a notebook.

## Core features

- **Tap-to-bill POS** — build a cart from a product catalog and charge in seconds.
- **UPI QR checkout** — generates a real, scannable upi://pay deep link QR code per order (no payment gateway, no commission).
- **Customer & staff capture at checkout** — every sale can be attributed to a customer (or "Walk-in") and the staff member who processed it.
- **Credit sales ("Udhaar")** — explicit checkout method for credit tracking. It requires a customer name and phone, capturing the transaction in the ledger immediately while skipping payment gateways.
- **Credit ledger ("Khata")** — tracks outstanding credit per customer; customers who've only ever paid Cash/UPI show lifetime spend instead of a due amount.
- **Per-customer purchase history** — every past order, itemized, per customer.
- **Products & Inventory** — stock levels, low-stock flags, restock actions.
- **Sales Insights & AI Forecasts** — daily/weekly/monthly totals and a restock forecast driven by a pure function module: uses a flat-average for a shop's first 14 days, then gracefully graduates to a weighted moving average (0.7 * recent 7 days + 0.3 * prior 7 days).
- **Printable bill/receipt** — itemized, includes shop details, staff, and customer, ready to print or send via SMS.
- **Guided onboarding** — shop name, starter product packs with preset Indian market prices, and UPI ID setup in three steps.
- **PWA & Offline-First behaviour** — entirely client-side via localforage (IndexedDB) and Workbox precaching. Once the app is loaded for the first time on a network connection, it installs to the homescreen and boots reliably offline. Note: UPI QR code generation works offline, but final payment confirmation depends on the payer's mobile network.
- **Backup & Restore** — hardened data safety without a server. Vendors can export their full data schema as a JSON backup or CSV spreadsheet, and cleanly restore it to a new device using a robust snapshot-validation flow.
- **Benchmark Mode** — built-in testing toggle to objectively track app vs. paper billing speeds. Passively records exact milliseconds from the first item tap to the payment screen, and finally to saved transaction, categorized strictly by basket size.

## Tech stack

- React 19 + TypeScript + Vite
- Tailwind CSS
- ite-plugin-pwa for manifest and offline service worker
- 
eact-router-dom for navigation
- localforage for all persistence (client-side only, no backend)
- qrcode for UPI QR generation
- date-fns for date handling
- itest for pure logic unit testing

## Project structure

`
src/
  components/       Shared UI components (ProductCard, etc.)
  layouts/          MainLayout — shared bottom nav + shell
  lib/              Pure business logic functions (forecast.ts, etc.)
  pages/            Billing, Checkout, Products, Credit, Insights, Settings
  pages/onboarding/ ShopName, StarterProducts, UPISetup
  store/            AppContext (global state), db.ts (localforage setup), types.ts
`

## Getting started

`ash
npm install
npm run dev
`

Then open the local URL Vite prints (typically http://localhost:5173).

## Build

`ash
npm run build
npm run preview
`

## Design system

The UI follows a design system tailored for outdoor, high-glare, single-handed use: high-contrast navy/amber/green palette, 48px+ minimum touch targets, tabular numerals for prices so digits don't jump around during fast billing. Screens were prototyped in Google Stitch before being built out as real, stateful React components.

## Status / scope notes

This is a college project (AI Immersion Programme, Continuation Track).
Currency formatting and payment options (UPI, ?) are currently India-specific; the data model is structured so these can be made configurable for other markets later. The UI itself has been kept in plain English for now, with room to reintroduce localization.
