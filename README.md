# Billo — Digital Khata & POS for Kirana Shops

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

- **Tap-to-bill POS** — build a cart from a product catalog and charge in
  seconds
- **UPI QR checkout** — generates a real, scannable `upi://pay` deep link
  QR code per order (no payment gateway, no commission)
- **Customer & staff capture at checkout** — every sale can be attributed
  to a customer (or "Walk-in") and the staff member who processed it
- **Printable bill/receipt** — itemized, includes shop details, staff, and
  customer, ready to print or send
- **Credit ledger ("Khata")** — tracks outstanding credit per customer;
  customers who've only ever paid Cash/UPI show lifetime spend instead of
  a due amount
- **Per-customer purchase history** — every past order, itemized, per
  customer
- **Products & Inventory** — stock levels, low-stock flags, restock
  actions
- **Sales Insights** — daily/weekly/monthly totals and a restock forecast
  driven by a weighted moving average (recent 7 days weighted higher than
  the prior 7, with a flat-average fallback for a product's first 14 days)
- **Guided onboarding** — shop name, starter product packs with preset
  Indian market prices, and UPI ID setup in three steps
- **Offline-first** — billing and credit tracking work with no network;
  built to sync later

## Tech stack

- React 19 + TypeScript + Vite
- Tailwind CSS
- `react-router-dom` for navigation
- `localforage` for all persistence (client-side only, no backend)
- `qrcode` for UPI QR generation
- `date-fns` for date handling

## Project structure

```
src/
  components/       Shared UI components (ProductCard, etc.)
  layouts/          MainLayout — shared bottom nav + shell
  pages/            Billing, Checkout, Products, Credit, Insights, Settings
  pages/onboarding/ ShopName, StarterProducts, UPISetup
  store/            AppContext (global state), db.ts (localforage setup),
                    types.ts (Product, Customer, SalesHistoryItem, etc.)
```

## Getting started

```bash
npm install
npm run dev
```

Then open the local URL Vite prints (typically `http://localhost:5173`).

## Build

```bash
npm run build
npm run preview
```

## Design system

The UI follows a design system tailored for outdoor, high-glare, single-
handed use: high-contrast navy/amber/green palette, 48px+ minimum touch
targets, tabular numerals for prices so digits don't jump around during
fast billing. Screens were prototyped in Google Stitch before being built
out as real, stateful React components.

## Status / scope notes

This is a college project (AI Immersion Programme, Continuation Track).
Currency formatting and payment options (UPI, ₹) are currently India-
specific; the data model is structured so these can be made configurable
for other markets later. The UI itself has been kept in plain English for
now, with room to reintroduce localization.
