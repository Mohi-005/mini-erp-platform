# Mini ERP (হিসাব) — Development Setup Guide

> **Practical Guide for Local Development, Testing, and Environment Configuration**  
> **Release Candidate:** `0.1.0-RC1`

---

## 1. System Requirements & Prerequisites

Before setting up the repository, ensure your development machine meets the following specifications:

| Component          | Minimum Version | Verified Version      | Notes                                                                   |
| :----------------- | :-------------- | :-------------------- | :---------------------------------------------------------------------- |
| **Node.js**        | `>=22.13.0`     | `24.21.0` / `24.19.0` | Required for native TypeScript stripping (`--experimental-strip-types`) |
| **npm**            | `>=11.0.0`      | `11.x`                | Native npm workspaces support required                                  |
| **Git**            | `>=2.40.0`      | `2.48.x`              | Source code control                                                     |
| **Supabase CLI**   | `>=2.121.0`     | `2.121.0`             | Cloud database management & migration tools                             |
| **Java JDK**       | `17+`           | OpenJDK 17            | Required only for native Android builds via Expo                        |
| **Android Studio** | Latest          | Ladybug / Otter       | Required only for physical Android device/emulator testing              |

> [!NOTE]
> **Container Runtime (Docker / Podman):**  
> Docker is **NOT required** for everyday web development or for executing tests against the hosted development database (`mini erp dev`). The Supabase CLI connects directly via HTTPS to execute queries, lint migrations, and verify schema integrity.

---

## 2. Repository Cloning & Dependency Installation

```bash
# 1. Clone the repository using your team's Git URL
git clone <REPOSITORY_URL>
cd "MINI ERP project HANDOFF"

# 2. Verify you are on the active handoff branch
git checkout handoff/phase2a

# 3. Clean-install all monorepo dependencies across apps and packages
npm ci
```

---

## 3. Environment Configuration

Mini ERP uses separate environment files for each application. Real credentials must **never** be committed to Git.

### 3.1. Web Application Configuration (`apps/web/.env.local`)

Create `apps/web/.env.local` by copying the example template:

```bash
cp apps/web/.env.example apps/web/.env.local
```

Populate `apps/web/.env.local` with your Supabase development credentials:

```ini
# Supabase Project API URL (Development)
VITE_SUPABASE_URL=https://<DEV_PROJECT_REF>.supabase.co

# Supabase Anonymous/Publishable Client Key
VITE_SUPABASE_PUBLISHABLE_KEY=<DEV_ANON_PUBLISHABLE_KEY>
```

### 3.2. Mobile Application Configuration (`apps/mobile/.env.local`)

Create `apps/mobile/.env.local` by copying the example template:

```bash
cp apps/mobile/.env.example apps/mobile/.env.local
```

Populate `apps/mobile/.env.local` with:

```ini
# Supabase Project API URL (Development)
EXPO_PUBLIC_SUPABASE_URL=https://<DEV_PROJECT_REF>.supabase.co

# Supabase Anonymous/Publishable Client Key
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<DEV_ANON_PUBLISHABLE_KEY>
```

> [!CAUTION]
> **Security Guard Rail:**  
> Never inject `SUPABASE_SERVICE_ROLE_KEY` into client environment files. Client applications require only the anonymous publishable key. All database permissions are enforced server-side via Row Level Security (RLS).

---

## 4. Running the Local Development Servers

### 4.1. Web Client (Vite)

To start the web application:

```bash
npm run dev
```

- Local URL: **`http://127.0.0.1:5173/`** (or `http://localhost:5173/`).
- The dev server supports Hot Module Replacement (HMR).

### 4.2. Mobile Client (Expo / React Native)

To start the Expo bundler:

```bash
# Start Expo Metro development server
npm run mobile

# Or launch directly on connected Android device/emulator
npm run android
```

---

## 5. Supabase Development & Database Verification

The project is synchronized with a hosted Supabase PostgreSQL development instance.

### 5.1. Linking to the Development Project

To link your local CLI session with the hosted development database:

```bash
# Authenticate CLI with your Supabase account
npx supabase login

# Link the local workspace to the DEV project
npx supabase link --project-ref <DEV_PROJECT_REF>
```

### 5.2. Inspecting Migrations

Verify that your local workspace migration history matches the remote development database:

```bash
npx supabase migration list
```

All 14 migrations must display as synchronized (`LOCAL` and `REMOTE` timestamps aligned).

### 5.3. Safe Database Query Execution

To inspect the database safely without modifying data or requiring local virtualization:

```bash
# Run a read-only query against the linked DEV database
npx supabase db query --linked "SELECT current_database(), current_user;"
```

---

## 6. Common Development Commands Reference

All common lifecycle tasks are accessible via root `package.json` scripts:

```bash
# -------------------------------------------------------------------------
# DEVELOPMENT
# -------------------------------------------------------------------------
npm run dev              # Launch Vite web dev server (http://127.0.0.1:5173)
npm run mobile           # Start Expo development server for mobile
npm run android          # Launch Android development build via Expo

# -------------------------------------------------------------------------
# STATIC ANALYSIS & QUALITY GATES
# -------------------------------------------------------------------------
npm run lint             # Run ESLint across entire repository (apps, packages)
npm run typecheck        # Run TypeScript type check across all workspaces
npm run format:check     # Verify code adheres to Prettier standards
npm run format           # Automatically format all files with Prettier

# -------------------------------------------------------------------------
# TESTING
# -------------------------------------------------------------------------
npm test                 # Run 86 shared unit tests via Node.js native test runner
npm run test:e2e         # Run 58 Playwright end-to-end integration browser tests

# -------------------------------------------------------------------------
# PRODUCTION BUILDS
# -------------------------------------------------------------------------
npm run build            # Compile web production bundle to apps/web/dist
npm run build:android    # Export mobile Hermes bundle to apps/mobile/dist

# -------------------------------------------------------------------------
# COMPLETE CI / RELEASE CHECK
# -------------------------------------------------------------------------
npm run check            # Runs: format:check + lint + typecheck + test + build + build:android
```

---

## 7. Troubleshooting & Common Setup Issues

### Issue 1: `Port 5173 is already in use`

- **Symptom:** Vite starts on port 5174 or fails with `EADDRINUSE`.
- **Cause:** A previous dev server process is still running in the background.
- **Solution (Windows PowerShell):**
  ```powershell
  Get-Process node | Stop-Process -Force
  npm run dev
  ```

### Issue 2: TypeScript errors on node imports (`node:test`, `node:assert`)

- **Symptom:** `Cannot find module 'node:test'` during `npm run typecheck`.
- **Cause:** Missing `@types/node` or outdated Node.js engine.
- **Solution:** Verify `node -v` returns $\ge 22.13.0$. Run `npm ci` to ensure root `@types/node` is installed.

### Issue 3: Missing Environment Variables Alert on Web UI

- **Symptom:** The browser displays a warning screen stating connection configuration is missing and disables auth forms.
- **Cause:** `apps/web/.env.local` does not exist or lacks `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY`.
- **Solution:** Copy `apps/web/.env.example` to `apps/web/.env.local` and provide valid development project keys. Restart Vite (`npm run dev`).

### Issue 4: Playwright browsers missing

- **Symptom:** `npm run test:e2e` fails with `Executable doesn't exist at ... Chromium`.
- **Solution:** Install the Playwright Chromium browser binary:
  ```bash
  npx playwright install chromium
  ```

### Issue 5: PowerShell script execution restricted

- **Symptom:** `npm run dev` or `npx` fails with `File cannot be loaded because running scripts is disabled on this system`.
- **Solution:** Enable local script execution in PowerShell for current user:
  ```powershell
  Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
  ```
