# Mini ERP (হিসাব) — Testing, Quality Assurance & Release Status

> **Quality Gate Verification, UAT Execution Matrix & Production Readiness Runbook**  
> **Release Candidate:** `0.1.0-RC1` | **Status:** `RELEASE_CANDIDATE_READY_FOR_OWNER_UAT`

---

## 1. Multi-Tiered Testing Architecture

Mini ERP employs six complementary testing methodologies to ensure functional correctness, data integrity, and multi-tenant security:

```
Testing Methodology Matrix:
1. Shared Unit Tests          --> Fast in-memory algorithmic & domain verification
2. Database pgTAP Tests       --> In-database RLS, check constraint & RPC rollback verification
3. Playwright E2E Tests       --> Full-browser UI interaction & navigation testing (mocked network)
4. Real DEV Browser Tests     --> Real browser interaction against linked Supabase DEV backend
5. Real DEV Forensic Checks   --> Database inspection of actual posted transactions
6. Manual Owner UAT           --> Hands-on business acceptance testing by the store owner
```

### Explanation of Testing Layers

1. **Shared Unit Tests (`packages/shared/tests/`):**
   - Executed via native Node.js test runner (`node --experimental-strip-types --test`).
   - Validates trilingual fuzzy search, unit conversions, decimal money normalization, phone number regexes, and permission logic.
   - Run time: $\sim 240\text{ms}$. Zero network or database dependencies.
2. **Database pgTAP Test Suites (`supabase/tests/database/`):**
   - Executed in PostgreSQL via `npx supabase db query --linked`.
   - Each test file wraps execution in a `BEGIN; ... ROLLBACK;` block to ensure zero persistent side-effects.
   - Directly asserts Row Level Security (RLS) enforcement, cross-tenant isolation, check constraints, and atomic RPC transaction rollbacks.
3. **Playwright Browser Tests (`e2e/`):**
   - Automated end-to-end browser scenarios running in headless Chromium.
   - Uses network mock interception (`page.route`) to test edge cases, error states, and responsive UI layouts reliably without polluting test databases.
4. **Real DEV Browser Verification:**
   - Headed browser sessions executing real user journeys against the live Supabase DEV backend.
   - Validates live Supabase Auth token exchange, real PostgREST queries, and RPC responses.
5. **Real DEV Forensic Audit:**
   - Read-only SQL queries inspecting committed production-like records, audit logs, and inventory ledger movements to prove atomicity.
6. **Manual Owner User Acceptance Testing (UAT):**
   - Structured checklist executed personally by the store owner to ensure the software matches real-world trading practices.

---

## 2. Verified Test Evidence & Quality Gates

The codebase has passed all automated quality gates prior to release candidate packaging:

| Verification Gate        | Command                       |            Expected Threshold            |         Verified Actual Result         |  Status  |
| :----------------------- | :---------------------------- | :--------------------------------------: | :------------------------------------: | :------: |
| **Code Formatting**      | `npm run format:check`        |              0 style issues              |  All matched files use Prettier style  | **PASS** |
| **Static Linting**       | `npm run lint`                |                 0 errors                 |   0 errors, 5 non-critical warnings    | **PASS** |
| **Type Checking**        | `npm run typecheck`           | 3 workspaces (`web`, `mobile`, `shared`) |          0 TypeScript errors           | **PASS** |
| **Unit Test Suite**      | `npm test`                    |              86 test cases               |     86 / 86 tests passing (~240ms)     | **PASS** |
| **Playwright E2E**       | `npm run test:e2e`            |              58 test cases               |      58 / 58 tests passing (~35s)      | **PASS** |
| **Database pgTAP**       | `supabase db query --linked`  |              6 test suites               |      189 / 189 assertions passing      | **PASS** |
| **Web Production Build** | `npm run build`               |          `apps/web/dist` bundle          |     Successfully compiled (~180ms)     | **PASS** |
| **Android Export**       | `npm run build:android`       |        `apps/mobile/dist` bundle         | Hermes bytecode bundle generated (~5s) | **PASS** |
| **Migration Sync**       | `npx supabase migration list` |         14 canonical migrations          |     14 / 14 local & remote synced      | **PASS** |

### Breakdown of pgTAP Database Assertions (189 Total)

- `identity_tenancy.test.sql`: 55 assertions (Auth, tenant isolation, RLS).
- `master_data.test.sql`: 47 assertions (Products, units, categories, trading partners).
- `master_data_regressions.test.sql`: 6 assertions (Archived product reference safeguards).
- `inventory_ledger.test.sql`: 34 assertions (Movements, check constraints, non-negative stock).
- `accounting_operations.test.sql`: 41 assertions (Atomic `post_sale`, `post_purchase`, landed cost, COGS).
- `sales_phone_persistence.test.sql`: 6 assertions (Customer phone snapshot persistence & audit log privacy).

---

## 3. Real DEV Workflow Evidence (Sanitized)

In addition to automated tests, two core data-altering business transactions were completed in real browser sessions on DEV under the Owner account and forensically verified in the database:

### 3.1. Purchase Workflow Evidence (Sanitized Purchase #10)

- **Document Type:** `purchases_documents`
- **Invoice Pattern:** `P-YYYYMMDD-XXXXXXXX`
- **Payment Method:** `CASH`
- **Procured Item:** 1 pair Personal Care Product (`SKU-CATV2-148`) = 2 base pieces.
- **Supplier:** Active procurement vendor.
- **Verified Ledger Effect:**
  - `purchases_documents` row committed.
  - `purchase_lines` row committed with calculated landed unit cost.
  - `inventory_balances` incremented by **+2**.
  - `inventory_movements` appended with type `'purchase'` and positive delta **+2**.
  - `business_audit_log` event `PURCHASE_POSTED` committed.

### 3.2. Sales Workflow Evidence (Sanitized Sales #9)

- **Document Type:** `sales_documents`
- **Invoice Pattern:** `S-YYYYMMDD-XXXXXXXX`
- **Payment Method:** `CASH`
- **Customer Context:** Walk-in cash customer with an optional 11-digit mobile snapshot.
- **Profile Impact:** No permanent customer profile created in `public.customers` (master directory clean).
- **Sold Item:** 2 base pieces Personal Care Product.
- **Verified Ledger Effect:**
  - `sales_documents` row committed containing `customer_phone_snapshot`.
  - `sales_lines` row committed with evaluated COGS.
  - `inventory_balances` decremented by **-2** (current stock safely returned to 0).
  - `inventory_movements` appended with type `'sale'` and negative delta **-2**.
  - `business_audit_log` event `SALE_POSTED` committed (with customer phone stripped for privacy).

> [!NOTE]
> **Duplicate Prevention Policy:**  
> These two real transactions provide conclusive evidence for `PUR-04` and `SALE-06`. The owner will inspect existing invoices in the UI rather than creating duplicate transactions during UAT.

---

## 4. User Acceptance Testing (UAT) Status

The canonical UAT checklist defined in [`docs/uat/FINAL_HUMAN_UAT_CHECKLIST.md`](docs/uat/FINAL_HUMAN_UAT_CHECKLIST.md) contains **48 test cases**:

- **39 Read-Only Cases:** Covering navigation, search, zero-stock badge rendering, estimator scenarios, invoice search, and reports. **100% verified via automated Playwright and pgTAP suites.**
- **9 Data-Altering Cases:** Require real database writes. Classified into:
  - **2 Completed Real Workflows (`PUR-04`, `SALE-06`):** Classified as `REAL_DEV_WORKFLOW_EVIDENCE_AVAILABLE — OWNER_REVIEW_REQUIRED`.
  - **7 Remaining Hand-on Cases:** Planned in [`docs/uat/OWNER_FINAL_UAT_EXECUTION.md`](docs/uat/OWNER_FINAL_UAT_EXECUTION.md) for owner sign-off.

### Detailed Status of the 9 Data-Altering Cases

|    UAT ID     | Feature Description                 | Action & Data Impact                                |                              Verification Status                               |
| :-----------: | :---------------------------------- | :-------------------------------------------------- | :----------------------------------------------------------------------------: |
| **`PUR-04`**  | Purchase Posting & Stock Increment  | Persistent purchase & stock addition (+2)           | `REAL_DEV_WORKFLOW_EVIDENCE_AVAILABLE`<br>_(Owner Review Only — No Duplicate)_ |
| **`SALE-06`** | Walk-in Sale with Mobile Snapshot   | Persistent sale & stock deduction (-2)              | `REAL_DEV_WORKFLOW_EVIDENCE_AVAILABLE`<br>_(Owner Review Only — No Duplicate)_ |
| **`STK-03`**  | Zero-Stock Replenishment Recovery   | Visual badge check / optional replenishment         |           `OWNER_ACTION_REQUIRED`<br>_(Visual Replenishment Check)_            |
| **`SALE-05`** | Cash Sale without Mobile Number     | Persistent sale document & inventory deduction      |              `OWNER_ACTION_REQUIRED`<br>_(Planned in Session 1)_               |
| **`SALE-07`** | Registered Shop Partial Credit Sale | Persistent sale & customer due update               |              `OWNER_ACTION_REQUIRED`<br>_(Planned in Session 1)_               |
| **`SHOP-02`** | Add New Shop to Directory           | Persistent shop record in `customers` table         |              `OWNER_ACTION_REQUIRED`<br>_(Planned in Session 2)_               |
| **`EXP-01`**  | Standard Expense Recording          | Persistent expense record in `business_expenses`    |              `OWNER_ACTION_REQUIRED`<br>_(Planned in Session 2)_               |
| **`EXP-02`**  | 'Other' Expense with Custom Note    | Persistent expense with note in `business_expenses` |              `OWNER_ACTION_REQUIRED`<br>_(Planned in Session 2)_               |
| **`SET-01`**  | Language Toggle & Reversion         | Reversible user preference update in `profiles`     |              `OWNER_ACTION_REQUIRED`<br>_(Planned in Session 2)_               |

---

## 5. Current Known Limitations & Pre-Release Advisories

1. **Owner UAT Pending:** Final sign-off on the remaining 7 data-altering UAT cases is an owner action that must be completed before production deployment.
2. **Production SMTP Unconfigured:** The development environment uses Supabase built-in auth email. Production deployment requires configuring a dedicated custom SMTP provider (e.g., SendGrid, Resend, Amazon SES) to guarantee transactional email deliverability for password resets.
3. **Physical Android Hardware QA:** Android builds have been verified via headless Metro Hermes compilation (`npm run build:android`). End-to-end device testing on physical low-end Android hardware remains a post-deployment verification task.
4. **Catalogue Images Disabled:** By explicit instruction of the project owner, catalogue images are disabled. The application operates in high-performance, image-free mode.

---

## 6. Release Status Summary

- **Release Candidate Version:** `0.1.0-RC1`
- **Git Branch:** `handoff/phase2a`
- **Development Database:** Verified against Supabase DEV instance (`mini erp dev`).
- **Production Status:** **NOT YET DEPLOYED.**
- **Code Freeze:** All core application features, database schemas, and unit tests are frozen. No further feature development is authorized until Owner UAT and Production configuration are complete.

---

## 7. Production Deployment Checklist (Runbook Overview)

When the business owner approves production rollout, follow the comprehensive procedure in [`docs/release/PRODUCTION_DEPLOYMENT_RUNBOOK.md`](docs/release/PRODUCTION_DEPLOYMENT_RUNBOOK.md):

```
Pre-Deployment Phase:
  [ ] 1. Provision new Supabase Production project (<PROD_PROJECT_REF>) in desired cloud region.
  [ ] 2. Configure Production custom domain and HTTPS certificates.
  [ ] 3. Configure production custom SMTP email provider in Supabase Auth dashboard.
  [ ] 4. Set secure password policies and rate limits in Supabase Auth settings.

Database Deployment:
  [ ] 5. Link Supabase CLI to production project: npx supabase link --project-ref <PROD_PROJECT_REF>
  [ ] 6. Apply all 14 canonical migrations: npx supabase db push
  [ ] 7. Verify migration list parity: npx supabase migration list
  [ ] 8. Verify RLS policies are active on all public tables: npx supabase db lint --linked

Client Build & Hosting:
  [ ] 9. Prepare production environment variables: apps/web/.env.production (Publishable anon key only).
  [ ] 10. Compile optimized web production bundle: npm run build
  [ ] 11. Deploy apps/web/dist to static hosting (Vercel, Netlify, or Cloudflare Pages).
  [ ] 12. Build and sign Android production release (.aab) for Google Play distribution.

Post-Deployment Verification (Smoke Testing):
  [ ] 13. Perform owner registration onboarding on live production domain.
  [ ] 14. Verify password recovery email receipt through production SMTP.
  [ ] 15. Verify single test purchase and test sale on production.
  [ ] 16. Verify immediate generation and archival of pre-launch production database backup.
```
