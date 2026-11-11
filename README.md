# Mini ERP / হিসাব

> **Bangla-First Multi-Tenant Business Management System for Bangladeshi Wholesalers, Distributors, and Retailers.**

Mini ERP (হিসাব) is a modern, lightweight, mobile-first Enterprise Resource Planning application designed specifically for Bangladeshi commercial trade. It empowers non-technical shop owners, wholesalers, and trading merchants to manage multi-product sales, purchases, inventory, trading partners, daily expenses, and profit estimation with zero financial ambiguity.

---

## Documentation Index

This repository contains comprehensive developer documentation. External development teams should consult the following guides:

| Document                                                         | Purpose                                                                                                                                                                          |
| :--------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **[`docs/DEVELOPER_HANDOFF.md`](docs/DEVELOPER_HANDOFF.md)**     | **Primary Developer Handoff Guide:** Full system breakdown, 21 module specifications, business rules, invariants, catalogue design, database schema, and source code navigation. |
| **[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)**               | **Technical Architecture Reference:** Monorepo architecture, data flow diagrams, atomic RPC operations, multi-tenant RLS model, and state management.                            |
| **[`docs/DEVELOPMENT_SETUP.md`](docs/DEVELOPMENT_SETUP.md)**     | **Local Development & Setup Guide:** Prerequisites, environment configuration, npm scripts, Supabase CLI integration, and troubleshooting.                                       |
| **[`docs/TESTING_AND_RELEASE.md`](docs/TESTING_AND_RELEASE.md)** | **Quality Assurance & Release Status:** Test evidence (unit, Playwright E2E, pgTAP), UAT matrix, release candidate status (`0.1.0-RC1`), and production checklist.               |
| **[`docs/requirements.md`](docs/requirements.md)**               | **Authoritative Requirements Register:** Functional requirements REQ-001 through REQ-033 and historical traceability.                                                            |

---

## Problem Solved & Business Context

Traditional accounting software built for Western markets fails Bangladeshi small-and-medium businesses (SMBs) due to:

- Complex double-entry bookkeeping jargon unfamiliar to local traders.
- Lack of native Bengali language support, numeral normalization, and local date contexts (Asia/Dhaka).
- Inflexible unit systems unable to handle indigenous trading units (বস্তা, খাঁচা, কার্টন, ডজন, কেজি, লিটার) and product-specific pack conversions.
- Failure to handle mixed-customer workflows: formal credit sales for registered shops vs. instantaneous cash walk-in sales with optional customer phone snapshots.
- Financial distortions where unpriced opening inventory is falsely reported as 100% gross profit.

**Mini ERP solves these challenges by providing:**

1. **Bengali-First Interface:** Complete UI, error messages, and operational workflows natively in Bengali with an instant English toggle.
2. **Atomic Document-Driven Operations:** Financial postings and inventory movements occur atomically inside PostgreSQL database transactions—never through vulnerable, sequential client REST calls.
3. **Canonical Trilingual Catalogue:** 283 pre-configured Bangladeshi commercial products searchable in Bengali script, English, or phonetically in Banglish (e.g., `Chira`, `Darchini`).
4. **Image-Free Operational Catalogue:** Clean, distraction-free, bandwidth-optimized catalogue designed for high-throughput counter sales without external image CDN dependencies.
5. **Strict Multi-Tenant Isolation:** Complete Row Level Security (RLS) ensuring merchants can never access, inspect, or modify another business's data.

---

## Core Implemented Modules

1. **Authentication & Identity:** Supabase Auth email/password authentication, password recovery, session persistence across web and mobile.
2. **Business & Multi-Tenancy:** Multi-tenant workspace management, initial business onboarding, and business settings.
3. **Master Data Management:** Complete CRUD, validation, and safe soft-archiving/restoring for Products, Product Categories, Product Units, Customers, and Suppliers.
4. **283 Canonical Product Catalogue:** Central catalog searchable by Bengali, English, and Banglish, with single-click tenant product adoption during Purchase workflows.
5. **Dynamic Units & Conversions:** Standard base units (কেজি, লিটার, পিস) with dynamic package conversions (বস্তা, কার্টন, ডজন, জোড়া, ড্রাম, খাঁচা, বান্ডিল).
6. **Supplier Management:** Track supplier contact details, address, notes, and purchase history.
7. **Purchase Engine:** Landed-cost calculation (freight/labor allocation across line items), supplier credit/cash payment, atomic stock receipt via `post_purchase` RPC.
8. **Inventory & Stock Ledger:** Real-time stock balance, movement history tracking, zero-stock soft-red visual alerts, and replenishment recovery.
9. **Sales Engine:** Fast counter sales, line-level discount support, stock availability guard (negative stock prevented), atomic stock decrement via `post_sale` RPC.
10. **Flexible Customer Models:** Support for both registered customer credit tracking and walk-in cash sales.
11. **Customer Mobile Snapshots:** Capture customer mobile numbers on walk-in cash sales as permanent invoice snapshots without polluting the customer master directory.
12. **Invoices & Transaction History:** Unified searchable ledger for Sales and Purchase documents, filtering by date, invoice ID, or customer/shop.
13. **Expense Management:** Daily operating expense tracking across categories (দোকান ভাড়া, পরিবহন, বিদ্যুৎ, বেতন, অন্যান্য) with custom descriptive notes.
14. **Cost of Goods Sold (COGS):** Moving weighted-average cost tracking; unpriced opening inventory is explicitly isolated to prevent distorted profit figures.
15. **Profit Estimator:** Sandboxed financial calculator allowing merchants to simulate purchase/sale margins, waste percentages, and transport costs without modifying live ledger data.
16. **Profit & Loss Reports:** Real-time gross profit and net operational profit reporting across customizable date ranges.
17. **Staff Permission Matrix:** Granular default-deny permission model allowing business owners to selectively grant operational capabilities (e.g., `sales.create`, `purchases.create`, `reports.view`) to staff members.
18. **Activity Audit Trail:** Server-side audit logging of all sensitive actions, price changes, and postings with strict customer phone privacy protection.

---

## Technology Stack

The project is structured as an npm workspaces monorepo using verified modern dependencies:

| Layer                | Technology              | Version                 | Purpose                                     |
| :------------------- | :---------------------- | :---------------------- | :------------------------------------------ |
| **Runtime**          | Node.js                 | `>=22.13.0`             | Monorepo toolchain and test runner          |
| **Package Manager**  | npm                     | `>=11.0.0`              | Workspaces dependency management            |
| **Web Frontend**     | React                   | `19.3.0`                | Component architecture                      |
|                      | React DOM               | `19.3.0`                | DOM rendering                               |
|                      | Vite                    | `^8.3.4`                | Development server and production bundler   |
|                      | Typography              | Hind Siliguri / Manrope | Bengali and Latin web fonts                 |
| **Mobile Frontend**  | React Native            | `0.88.0`                | Cross-platform mobile framework             |
|                      | Expo                    | `~58.0.14`              | Mobile toolchain & Hermes engine            |
| **Database & Auth**  | Supabase PostgreSQL     | `15+`                   | Relational database, RLS, and RPCs          |
|                      | Supabase Auth           | Managed                 | Secure user identity & JWT sessions         |
|                      | `@supabase/supabase-js` | `^2.118.0`              | Universal client SDK                        |
| **Language & Types** | TypeScript              | `~5.9.2`                | End-to-end static typing                    |
| **Testing**          | Node Test Runner        | Native                  | Unit testing (`--experimental-strip-types`) |
|                      | Playwright              | `^1.65.0`               | End-to-end browser workflow testing         |
|                      | pgTAP                   | In-database             | PostgreSQL schema & RLS assertion testing   |
| **Lint & Format**    | ESLint                  | `^10.13.0`              | Static code analysis (Flat config)          |
|                      | Prettier                | `^3.6.2`                | Automated code formatting                   |

---

## Monorepo Structure

```
├── apps/
│   ├── web/                     # React 19 + Vite responsive web application
│   │   ├── src/
│   │   │   ├── FoundationApp.tsx        # Auth gate, tenant selector, session lifecycle
│   │   │   ├── MasterDataWorkspace.tsx  # Master data views & dashboard
│   │   │   ├── OperationsPanels.tsx     # Sales, Purchases, Expenses, Invoices, Settings
│   │   │   ├── InventoryWorkspace.tsx   # Dedicated stock ledger workspace
│   │   │   ├── SalesWorkspace.tsx       # Dedicated POS sales workspace
│   │   │   └── App.tsx                  # Preserved Version 3 synthetic demo mode
│   │   └── package.json
│   └── mobile/                  # React Native + Expo mobile application
│       ├── App.tsx                      # Mobile entry point
│       ├── FoundationApp.tsx            # Mobile auth and session wrapper
│       └── package.json
├── packages/
│   └── shared/                  # Universal business logic, services, and types
│       ├── src/
│       │   ├── auth.ts                  # Session & tenant state machine
│       │   ├── permissions.ts           # Merchant permission definitions
│       │   ├── catalogue.ts             # 283 canonical catalogue dataset
│       │   ├── catalogue-service.ts     # Catalogue search & tenant adoption
│       │   ├── units.ts                 # Product unit conversion engine
│       │   ├── sales-service.ts         # Sales calculation & payload builder
│       │   ├── inventory-service.ts     # Stock movement formatting
│       │   ├── master-data-service.ts   # Entity CRUD services
│       │   ├── phone.ts                 # BD mobile validation & normalization
│       │   └── database.types.ts        # Generated Supabase database types
│       └── tests/                       # 86 comprehensive unit test suites
├── supabase/                    # Canonical database configuration
│   ├── config.toml                      # Supabase CLI configuration
│   ├── migrations/                      # 14 synchronized SQL migrations
│   └── tests/database/                  # 6 pgTAP database test suites
├── e2e/                         # Playwright E2E integration test suites (58 tests)
└── docs/                        # Complete architecture, setup, and handoff documentation
```

---

## Quick Start (Local Development)

```bash
# 1. Clone the repository
git clone <REPOSITORY_URL>
cd "MINI ERP project HANDOFF"

# 2. Install dependencies across all workspaces
npm ci

# 3. Configure environment variables
# Copy template files to .env.local (do NOT commit secrets)
cp apps/web/.env.example apps/web/.env.local
cp apps/mobile/.env.example apps/mobile/.env.local

# 4. Start the Web application locally
npm run dev
# The application will be running at http://127.0.0.1:5173/

# 5. Run the full verification suite
npm run check
```

For detailed setup instructions, database linking, and troubleshooting, see **[`docs/DEVELOPMENT_SETUP.md`](docs/DEVELOPMENT_SETUP.md)**.

---

## Current Release Status

- **Current Version:** `0.1.0-RC1` (Release Candidate 1)
- **Active Git Branch:** `handoff/phase2a`
- **Verification Environment:** Tested and verified against hosted Supabase Development (`mini erp dev`).
- **Test Evidence:**
  - **Unit Tests:** 86/86 passing (`npm test`, ~240ms)
  - **E2E Playwright Tests:** 58/58 passing (`npm run test:e2e`, ~35s)
  - **Database pgTAP Assertions:** 189/189 assertions passing across 6 suites
  - **Type Checking:** 0 TypeScript errors across all 3 workspaces (`npm run typecheck`)
  - **Linting:** 0 ESLint errors (`npm run lint`)
  - **Web Build:** Production bundle compiled successfully to `apps/web/dist`
  - **Android Export:** Metro Hermes bytecode export verified to `apps/mobile/dist`
  - **Migrations:** 14/14 database migrations fully synchronized
- **Deployment Status:** **Production is NOT yet deployed.** The application is in pre-release candidate status awaiting final Owner User Acceptance Testing (UAT) and production infrastructure configuration.

---

## Security & Privacy Notice

> [!IMPORTANT]
>
> - **Zero Secrets in Code:** Real Supabase service-role keys, database passwords, user tokens, and production secrets must never be committed to Git.
> - **Client Isolation:** Client applications (`apps/web`, `apps/mobile`) only receive anonymous publishable keys (`anon`/`publishable`). All data access is strictly governed by PostgreSQL Row Level Security (RLS).
> - **Audit Log Privacy:** In compliance with local privacy principles, personal mobile numbers captured during walk-in sales are excluded from public audit log tables.
