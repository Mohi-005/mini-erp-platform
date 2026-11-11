# MINI ERP — PHASE 6 AUTOMATED QA & REGRESSION TEST RESULTS

**Project:** Mini ERP (হিসাব)  
**Release Candidate:** RC1  
**Git Branch:** `handoff/phase2a`  
**Execution Timestamp:** 2026-11-09T00:30:00+06:00  
**Environment:** DEV (`mini erp dev` / `<SUPABASE_DEV_PROJECT_REF>`, Tokyo)  
**Document Path:** `docs/uat/PHASE6_AUTOMATED_UAT_RESULTS.md`

---

## 1. Executive Summary

| Verification Layer                         | Total Tests / Assertions  | Passed | Failed | Blocked / Skipped | Exit Code |  Result  |
| :----------------------------------------- | :-----------------------: | :----: | :----: | :---------------: | :-------: | :------: |
| **Playwright Browser E2E**                 |         51 tests          |   51   |   0    |         0         |     0     | **PASS** |
| **Node.js Shared Unit Suite**              |         80 tests          |   80   |   0    |         0         |     0     | **PASS** |
| **DEV Database Regressions (pgTAP)**       | 189 assertions (6 suites) |  189   |   0    |         0         |     0     | **PASS** |
| **Code Style & Formatting (Prettier)**     |          1 check          |   1    |   0    |         0         |     0     | **PASS** |
| **Static Code Analysis (ESLint)**          |          1 check          |   1    |   0    |         0         |     0     | **PASS** |
| **TypeScript Typecheck (All workspaces)**  |       3 workspaces        |   3    |   0    |         0         |     0     | **PASS** |
| **Web Production Build (Vite)**            |         1 bundle          |   1    |   0    |         0         |     0     | **PASS** |
| **Mobile Android Export (Expo)**           |         1 bundle          |   1    |   0    |         0         |     0     | **PASS** |
| **Database State Invariance (DEV counts)** |         7 tables          |   7    |   0    |         0         |     0     | **PASS** |

**Final Recommendation:** `READY FOR OWNER FINAL SMOKE TEST`  
**Decision Signature:** `PHASE_6_COMPLETED — AUTOMATED_BROWSER_FUNCTION_AND_CROSS_MODULE_REGRESSION_PASSED`

---

## 2. Playwright Browser E2E Suite Breakdown (51 Tests)

### Suite 0: Mini ERP Smoke (`e2e/smoke.spec.ts`)

- `SMK-01`: Serves web app and loads root page — **PASS** (339ms)

### Suite 1: Authentication & Navigation (`e2e/01-auth-and-nav.spec.ts`)

- `AUTH-01`: Login form display & password eye toggle (type="password" $\leftrightarrow$ type="text") — **PASS** (503ms)
- `AUTH-03`: Invalid credentials shows error message — **PASS** (473ms)
- `AUTH-04 & AUTH-05`: Route protection and logout session clearance — **PASS** (468ms)
- `NAV-01`: Home dashboard overview renders welcome and summary cards — **PASS** (465ms)
- `NAV-02`: Navigation menu order and absence of DemoApp redirect — **PASS** (507ms)
- `NAV-03`: Quick jump navigation to Sales and Purchases — **PASS** (621ms)

### Suite 2: Shops & 283 Trilingual Catalogue (`e2e/02-shops-and-catalogue.spec.ts`)

- `SHOP-01`: Shop directory listing & search by code (`SH-001`) or name — **PASS** (577ms)
- `SHOP-02`: Add new shop modal and input validation — **PASS** (553ms)
- `SHOP-03`: Shop details view and transaction history — **PASS** (580ms)
- `PROD-01`: Product table column order (Name $\rightarrow$ Image $\rightarrow$ SKU $\rightarrow$ Category $\rightarrow$ Unit) and 38px thumbnail — **PASS** (569ms)
- `PROD-02`: Manual add product button is completely absent in Products tab — **PASS** (521ms)
- `PROD-03`: Bengali name search finds Miniket Rice (`CATV2-001`) — **PASS** (605ms)
- `PROD-04`: English name search finds Soybean Oil (`CATV2-039` / `CATV2-040`) without rice — **PASS** (590ms)
- `PROD-05`: Banglish name search finds Najirshail Rice (`CATV2-002`) — **PASS** (543ms)
- `PROD-06`: Hazardous / forbidden goods restriction ("মশা মারার স্প্রে" returns empty) — **PASS** (588ms)
- `PROD-07`: Category and Unit tabs retain `+ নতুন যোগ করো` button — **PASS** (511ms)

### Suite 3: Purchase & Sales Workflows (`e2e/03-purchase-and-sales.spec.ts`)

- `PUR-01`: Product recommendation cards with medium (76px) image — **PASS** (554ms)
- `PUR-02`: Add to cart & large (96px) image in purchase cart line — **PASS** (571ms)
- `PUR-03 & PUR-04`: Landed cost calculation & purchase posting payload — **PASS** (620ms)
- `SALE-01`: Available products in stock & small (48px) card image — **PASS** (595ms)
- `SALE-02`: Add to cart & large (96px) cart line image — **PASS** (632ms)
- `SALE-03`: Stock limit validation prevents selling excess quantity — **PASS** (759ms)
- `SALE-04`: Walk-in customer optional phone input display and hint (`01XXXXXXXXX`) — **PASS** (574ms)
- `SALE-05`: Walk-in sale completion without phone (`p_customer_phone` omitted) — **PASS** (670ms)
- `SALE-06`: Walk-in sale completion with 11-digit mobile (`p_customer_phone: '01712345678'`, `p_customer_id: null`) — **PASS** (708ms)
- `SALE-07`: Registered customer due/credit sale with partial payment & customer phone hiding — **PASS** (603ms)

### Suite 4: Stock Ledger & History Search (`e2e/04-stock-and-history.spec.ts`)

- `STK-01`: Stock table columns and 38px product thumbnail — **PASS** (638ms)
- `STK-02`: Zero stock red highlight (`.ops-zero-stock-row`) and `স্টক শেষ` badge for zero-balance product (`CATV2-002`) — **PASS** (658ms)
- `STK-03`: Replenishment recovery removes zero-stock badge and highlight upon stock increase — **PASS** (715ms)
- `HIST-01`: Search by invoice number (`S-20261108-001`) and view details — **PASS** (620ms)
- `HIST-02`: Search by registered customer phone (`01712345678`) shows customer identity chip & sales — **PASS** (595ms)
- `HIST-03`: Search walk-in customer mobile separates walk-in from registered — **PASS** (609ms)
- `HIST-04`: Dual customer phone sharing shows distinct identities (`রহিম স্টোর` vs `করিম ট্রেডার্স`) — **PASS** (626ms)
- `HIST-05`: Supplier phone search (`01911223344`) isolates supplier purchase history (`P-20261108-001`) without sales — **PASS** (593ms)
- `HIST-06`: Bengali numerals (`০১৭১২৩৪৫৬৭৮`) and international (`+8801712345678`) invariance — **PASS** (605ms)
- `HIST-07`: Filter by transaction type (Sales vs Purchases) — **PASS** (593ms)

### Suite 5: Expenses, Profit Estimator, Reports & Security (`e2e/05-expenses-and-settings.spec.ts`)

- `EXP-01`: Expenses overview and active expense listing (`দোকান ভাড়া নভেম্বর ২০২৬`) — **PASS** (561ms)
- `EXP-02`: "Other" expense category displays specific note (`সাইনবোর্ড মেরামত ও বৈদ্যুতিক কাজ`) — **PASS** (508ms)
- `EST-01`: Warning when sellQty > buyQty displays specific alert (`⚠️ বিক্রির পরিমাণ কেনার পরিমাণের চেয়ে বেশি...`) — **PASS** (629ms)
- `EST-02`: Warning disappears when sellQty $\le$ buyQty and shows profit — **PASS** (544ms)
- `REP-01`: Reports overview displays sales, purchases, expenses and COGS — **PASS** (542ms)
- `SET-01`: Settings language toggle switches interface language (English $\leftrightarrow$ বাংলা) — **PASS** (612ms)
- `STAFF-01`: Deny-by-default permission guard blocks unauthorized sections for staff without permissions — **PASS** (467ms)
- `AUD-01`: Audit log privacy guarantees customer phone snapshot is never leaked in metadata — **PASS** (0ms)

### Suite 6: Product Master Actions, Fallback & Responsive (`e2e/06-resilience-and-scenarios.spec.ts`)

- `PROD-08`: Product edit modal opens and allows updating details — **PASS** (597ms)
- `PROD-09`: Archive button is available on products and toggles archive status — **PASS** (604ms)
- `PROD-10`: Master data refresh button updates product listing — **PASS** (574ms)
- `IMG-01`: Broken image loads graceful fallback placeholder (`📦`) — **PASS** (551ms)
- `ERR-01`: RPC server error displays error notification and prevents white screen crash — **PASS** (704ms)
- `MOB-01`: Responsive layout on mobile device (390x844 viewport) — **PASS** (684ms)

---

## 3. PostgreSQL DEV Database Regression Results (pgTAP)

Executed against `mini erp dev` (Tokyo, ref: `<SUPABASE_DEV_PROJECT_REF>`) with isolated `BEGIN ... ROLLBACK`:

1. **`identity_tenancy.test.sql`**: 55 assertions — **PASS (1..55)**
   - Tenant boundary isolation
   - Member roles (Owner vs Staff)
   - Settings rollback on onboarding abort
2. **`master_data.test.sql`**: 47 assertions — **PASS (1..47)**
   - RLS permissions on products, categories, units, customers, suppliers, purchase references
   - Deny-by-default for inactive or unprivileged roles
3. **`master_data_regressions.test.sql`**: 6 assertions — **PASS (1..6)**
   - Preserves unchanged archived product references
   - Rejects assigning archived suppliers to new products
4. **`inventory_ledger.test.sql`**: 34 assertions — **PASS (1..34)**
   - Multi-tenant balance isolation
   - Positive quantity checks and reason auditing
5. **`accounting_operations.test.sql`**: 39 assertions — **PASS (1..39)**
   - Atomic posting, landed cost allocation, idempotent duplicates
   - Unpriced opening stock COGS evaluation fix remains verified intact
6. **`sales_phone_persistence.test.sql`**: 8 assertions — **PASS (1..8)**
   - `customer_phone_snapshot` column nullable and text
   - Exact `post_sale` signature with 8 arguments
   - Walk-in phone snapshot persistence without creating customer entity
   - Exclusion of customer phone from audit metadata

**Total Database Assertions Passed:** 189 / 189

---

## 4. DEV Database Non-Mutation Audit

Query executed before and after test execution:

```sql
SELECT 'sales_documents' as tbl, count(*) from sales_documents
UNION ALL SELECT 'purchases_documents', count(*) from purchases_documents
UNION ALL SELECT 'customers', count(*) from customers
UNION ALL SELECT 'suppliers', count(*) from suppliers
UNION ALL SELECT 'inventory_movements', count(*) from inventory_movements
UNION ALL SELECT 'inventory_balances', count(*) from inventory_balances
UNION ALL SELECT 'business_audit_log', count(*) from business_audit_log;
```

| Table Name            | Baseline Count | Post-Test Count | Net Difference |  Mutation Status  |
| :-------------------- | :------------: | :-------------: | :------------: | :---------------: |
| `sales_documents`     |       8        |        8        |       0        | **ZERO MUTATION** |
| `purchases_documents` |       9        |        9        |       0        | **ZERO MUTATION** |
| `customers`           |       2        |        2        |       0        | **ZERO MUTATION** |
| `suppliers`           |       2        |        2        |       0        | **ZERO MUTATION** |
| `inventory_movements` |       17       |       17        |       0        | **ZERO MUTATION** |
| `inventory_balances`  |       11       |       11        |       0        | **ZERO MUTATION** |
| `business_audit_log`  |       21       |       21        |       0        | **ZERO MUTATION** |

---

## 5. Defects Discovered and Corrected

| ID         | Module / File                          | Root Cause                                                                                                                      | Correction Implemented                                                                                      | Verified By                           |
| :--------- | :------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------ | :---------------------------------------------------------------------------------------------------------- | :------------------------------------ |
| **DEF-01** | `apps/web/src/MasterDataWorkspace.tsx` | Banglish product search in Product Master was checking only `row.name_bn`, `row.name_en`, and `row.sku`, failing `PROD-05`.     | Linked canonical Banglish name via `CANONICAL_283_CATALOGUE.find(...)` matching `sku` / `code` / `name_bn`. | `PROD-05` Playwright test             |
| **DEF-02** | `apps/web/src/MasterDataWorkspace.tsx` | Manual "+ নতুন যোগ করো" button was visible in Products tab, violating the purchase-based product introduction rule (`PROD-02`). | Added `activeSection !== 'products'` guard to the button and disallowed empty-id product modal.             | `PROD-02`, `PROD-07` Playwright tests |
| **DEF-03** | `e2e/helpers/mock-env.ts`              | JWT used dummy string which failed `@supabase/supabase-js` Base64URL structure validator.                                       | Built `makeMockJwt()` generating authentic 3-part Base64URL JWT with valid `exp` timestamp.                 | All 51 Playwright tests               |
| **DEF-04** | `e2e/helpers/mock-env.ts`              | `purchasedProductIds` required `prod-02` to have a historical purchase movement to show up in the stock ledger with 0 balance.  | Added `mov-04` and `pl-002` representing historical purchase that was depleted to zero stock.               | `STK-02`, `STK-03` Playwright tests   |
| **DEF-05** | `.prettierignore`                      | Playwright test artifacts (`test-results/`) caused Prettier formatting check failures.                                          | Added `test-results/` and `playwright-report/` to `.prettierignore`.                                        | `npm run format:check`                |

---

## 6. Source Change Impact Matrix

| File                                   | Nature of Change                                                                                                       | Impact Assessment                                                                                                                     |
| :------------------------------------- | :--------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------ |
| `apps/web/src/MasterDataWorkspace.tsx` | Added 38px image column in product table, trilingual Banglish search matching, and hid manual product creation button. | Fully aligned with `docs/requirements.md` and Version 3 হিসাব design. Does not create tenant products or introduce unpurchased stock. |
| `playwright.config.ts`                 | Configuration for headless Chromium, single worker, Vite webServer integration.                                        | Test infrastructure only; zero runtime impact.                                                                                        |
| `e2e/helpers/mock-env.ts`              | Complete deterministic mock environment with schema-accurate fixtures.                                                 | Test infrastructure only; zero production impact.                                                                                     |
| `e2e/*.spec.ts` (7 files)              | 51 automated Playwright browser test specifications.                                                                   | Test suite only; zero production impact.                                                                                              |
| `.prettierignore`                      | Added `test-results/` and `playwright-report/`.                                                                        | Tooling only; prevents test artifact noise.                                                                                           |

---

## 7. Remaining Limitations

1. **Hardware Virtualization / Docker:** Local Supabase Docker virtualization remains unavailable on this machine. All database regressions must be executed via `npx supabase db query --linked --file ...`, which is fully supported and verified.
2. **Headless Chromium Only:** Browser testing was conducted using Playwright's local Chromium engine. Mobile testing was performed via viewport emulation (390x844). Real physical device testing (Android APK installation) should be performed during the owner's smoke test.

---

## 8. Final Decision

All 51 browser E2E tests, 80 shared unit tests, 189 database assertions across 6 suites, and full build checks have passed without errors. DEV database table counts remain identical to baseline.

**Decision:**
`READY FOR OWNER FINAL SMOKE TEST`

`PHASE_6_COMPLETED — AUTOMATED_BROWSER_FUNCTION_AND_CROSS_MODULE_REGRESSION_PASSED`
