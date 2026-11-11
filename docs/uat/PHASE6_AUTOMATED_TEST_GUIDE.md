# MINI ERP — PHASE 6 AUTOMATED QA & REGRESSION EXECUTION GUIDE

**Project:** Mini ERP (হিসাব)  
**Branch:** `handoff/phase2a`  
**Target Environment:** DEV (`mini erp dev` / `<SUPABASE_DEV_PROJECT_REF>`, Tokyo)  
**Document Path:** `docs/uat/PHASE6_AUTOMATED_TEST_GUIDE.md`

---

## 1. Overview

This document provides exact, repeatable, and non-destructive terminal commands for the owner to run the entire automated quality assurance suite for Mini ERP.

The test suite covers:

1. **Playwright Browser E2E Suite** (51 automated end-to-end tests across all core modules).
2. **TypeScript & Shared Unit Test Suite** (80 unit tests covering trilingual catalogue, calculations, units, phone normalization, and security rules).
3. **Database Test Suites (pgTAP)** (6 suites with 189 assertions executed via `BEGIN ... ROLLBACK` on the linked DEV Supabase project without leaving persistent records).
4. **Full Project Health & Build Suite** (Prettier format check, ESLint, TypeScript check, Vite web production build, and Expo Android export).

---

## 2. Prerequisites & Environment Check

Before executing tests, verify that you are in the project root directory and linked to the DEV Supabase environment:

```powershell
# Verify Git branch (must be handoff/phase2a)
git status

# Verify linked Supabase DEV project (<SUPABASE_DEV_PROJECT_REF>)
npx supabase projects list
```

---

## 3. Playwright Browser E2E Tests (Automated UI)

All browser tests run against the local Vite dev server with deterministic network interception (`mock-env.ts`), ensuring no test data pollutes the DEV database.

### Run All 51 E2E Tests:

```powershell
npx playwright test
```

### Run by Specific Modules:

```powershell
# 1. Smoke test
npx playwright test e2e/smoke.spec.ts

# 2. Authentication, route protection & navigation menu (AUTH-01 to AUTH-06, NAV-01 to NAV-03)
npx playwright test e2e/01-auth-and-nav.spec.ts

# 3. Shops & 283 Trilingual Catalogue (SHOP-01 to SHOP-03, PROD-01 to PROD-07)
npx playwright test e2e/02-shops-and-catalogue.spec.ts

# 4. Purchases & Sales Workflows (PUR-01 to PUR-04, SALE-01 to SALE-07)
npx playwright test e2e/03-purchase-and-sales.spec.ts

# 5. Stock Ledger & Invoice/Transaction History Search (STK-01 to STK-03, HIST-01 to HIST-07)
npx playwright test e2e/04-stock-and-history.spec.ts

# 6. Expenses, Profit Estimator, Reports, Settings & Staff Guard (EXP-01, EXP-02, EST-01, EST-02, REP-01, SET-01, STAFF-01, AUD-01)
npx playwright test e2e/05-expenses-and-settings.spec.ts

# 7. Image Fallback, Error Resilience & Mobile Layout (PROD-08 to PROD-10, IMG-01, ERR-01, MOB-01)
npx playwright test e2e/06-resilience-and-scenarios.spec.ts
```

---

## 4. Shared Unit Test Suite (80 Tests)

Runs unit tests using Node.js native test runner and TypeScript type stripping:

```powershell
npm test
```

---

## 5. PostgreSQL Database Regression Tests (pgTAP on DEV)

All database test files begin with `begin;` and conclude with `rollback;`. They execute inside an isolated transaction and leave zero persistent fixtures on DEV.

```powershell
# 1. Identity & Tenancy Isolation (55 assertions)
npx supabase db query --linked --file supabase/tests/database/identity_tenancy.test.sql

# 2. Master Data RLS & Security (47 assertions)
npx supabase db query --linked --file supabase/tests/database/master_data.test.sql

# 3. Master Data Reference Regressions (6 assertions)
npx supabase db query --linked --file supabase/tests/database/master_data_regressions.test.sql

# 4. Inventory Ledger & Balances (34 assertions)
npx supabase db query --linked --file supabase/tests/database/inventory_ledger.test.sql

# 5. Accounting Operations, Landed Cost & COGS (39 assertions)
npx supabase db query --linked --file supabase/tests/database/accounting_operations.test.sql

# 6. Walk-in Customer Phone Persistence & Privacy (8 assertions)
npx supabase db query --linked --file supabase/tests/database/sales_phone_persistence.test.sql
```

### Verify DEV Table Counts (Non-Mutation Invariance Check):

```powershell
npx supabase db query --linked "SELECT 'sales_documents' as tbl, count(*) from sales_documents UNION ALL SELECT 'purchases_documents', count(*) from purchases_documents UNION ALL SELECT 'customers', count(*) from customers UNION ALL SELECT 'suppliers', count(*) from suppliers UNION ALL SELECT 'inventory_movements', count(*) from inventory_movements UNION ALL SELECT 'inventory_balances', count(*) from inventory_balances UNION ALL SELECT 'business_audit_log', count(*) from business_audit_log;"
```

Expected output:

- `sales_documents`: 8
- `purchases_documents`: 9
- `customers`: 2
- `suppliers`: 2
- `inventory_movements`: 17
- `inventory_balances`: 11
- `business_audit_log`: 21

---

## 6. Comprehensive Project Health Check (`npm run check`)

To run the complete automated build and verification pipeline in one command:

```powershell
npm run check
```

This sequentially executes:

1. `npm run format:check` (Prettier code style verification)
2. `npm run lint` (ESLint linting with 0 errors)
3. `npm run typecheck` (Full workspace TypeScript verification)
4. `npm test` (80 unit tests)
5. `npm run build` (Vite web production compilation)
6. `npm run build:android` (Expo Android mobile compilation)
