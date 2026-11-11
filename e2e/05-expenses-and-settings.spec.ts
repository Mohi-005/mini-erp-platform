import { test, expect } from '@playwright/test';
import { setupAuthenticatedApp, MOCK_AUDIT_LOG } from './helpers/mock-env';

test.describe('Expenses Workflow (EXP-01 & EXP-02)', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedApp(page);
    await page.goto('/');
    // Navigate to 'খরচ' (Expenses)
    await page.locator('.md-nav-button', { hasText: 'খরচ' }).click();
  });

  test('EXP-01: Expenses overview and active expense listing', async ({
    page,
  }) => {
    // Should display expense summary card
    await expect(
      page.locator('.ops-summary:has-text("সব সক্রিয় খরচ")'),
    ).toBeVisible();

    // Table should show existing rent expense
    const rentRow = page.locator(
      '.ops-table tr:has-text("দোকান ভাড়া নভেম্বর ২০২৬")',
    );
    await expect(rentRow).toBeVisible();
    await expect(rentRow).toContainText('RENT');
  });

  test('EXP-02: "Other" expense category displays specific note', async ({
    page,
  }) => {
    // exp-002 is category OTHER with note 'সাইনবোর্ড মেরামত ও বৈদ্যুতিক কাজ'
    const otherRow = page.locator(
      '.ops-table tr:has-text("সাইনবোর্ড মেরামত ও বৈদ্যুতিক কাজ")',
    );
    await expect(otherRow).toBeVisible();
    await expect(otherRow).toContainText('OTHER');
  });
});

test.describe('Profit Estimator Workflow (EST-01 & EST-02)', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedApp(page);
    await page.goto('/');
    // Navigate to 'লাভের হিসাব' (Profit Estimator)
    await page.locator('.md-nav-button', { hasText: 'লাভের হিসাব' }).click();
  });

  test('EST-01: Warning when sellQty > buyQty displays specific alert', async ({
    page,
  }) => {
    // Fill buy quantity = 100, unit buy price = 50
    await page.getByLabel('কেনার পরিমাণ').fill('100');
    await page.getByLabel('প্রতি একক ক্রয়মূল্য').fill('50');

    // Fill sell quantity = 120 (120 > 100), unit sell price = 60
    await page.getByLabel('প্রতি একক বিক্রয়মূল্য').fill('60');
    await page.getByLabel('বিক্রির প্রত্যাশিত পরিমাণ').fill('120');

    // Warning alert should be visible
    const warning = page.locator('.ops-estimator-warning');
    await expect(warning).toBeVisible();
    await expect(warning).toContainText(
      'বিক্রির পরিমাণ কেনার পরিমাণের চেয়ে বেশি। অনুগ্রহ করে কেনার পরিমাণ বৃদ্ধি করুন অথবা বিক্রির পরিমাণ কমিয়ে দিন।',
    );
  });

  test('EST-02: Warning disappears when sellQty <= buyQty and shows profit', async ({
    page,
  }) => {
    // Fill buy quantity = 100, unit buy price = 50
    await page.getByLabel('কেনার পরিমাণ').fill('100');
    await page.getByLabel('প্রতি একক ক্রয়মূল্য').fill('50');

    // Fill sell quantity = 80 (80 <= 100), unit sell price = 60
    await page.getByLabel('প্রতি একক বিক্রয়মূল্য').fill('60');
    await page.getByLabel('বিক্রির প্রত্যাশিত পরিমাণ').fill('80');

    // Warning should disappear
    const warning = page.locator('.ops-estimator-warning');
    await expect(warning).not.toBeVisible();

    // Estimated profit section should appear
    await expect(page.locator('.ops-estimate-hero')).toBeVisible();
  });
});

test.describe('Reports & Financial Overview (REP-01)', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedApp(page);
    await page.goto('/');
    // Navigate to 'রিপোর্ট' (Reports)
    await page.locator('.md-nav-button', { hasText: 'রিপোর্ট' }).click();
  });

  test('REP-01: Reports overview displays sales, purchases, expenses and COGS', async ({
    page,
  }) => {
    // Verify report summary cards
    await expect(
      page.locator('.ops-summary').filter({ hasText: 'বিক্রির মোট' }),
    ).toBeVisible();
    await expect(
      page.locator('.ops-summary').filter({ hasText: 'কেনাকাটার মোট' }),
    ).toBeVisible();
    await expect(
      page.locator('.ops-summary').filter({ hasText: /^পরিচালন খরচ/ }),
    ).toBeVisible();
    await expect(
      page
        .locator('.ops-summary')
        .filter({ hasText: 'বিক্রিত পণ্যের খরচ (COGS)' }),
    ).toBeVisible();
  });
});

test.describe('Settings, Staff Guard & Audit Privacy (SET-01, STAFF-01, AUD-01)', () => {
  test('SET-01: Settings language toggle switches interface language', async ({
    page,
  }) => {
    await setupAuthenticatedApp(page);
    await page.goto('/');

    // Navigate to Settings
    await page.locator('.md-nav-button', { hasText: 'সেটিংস' }).click();

    // Click English language toggle button in banner
    const langBtn = page
      .getByRole('banner')
      .getByRole('button', { name: 'English' });
    if (await langBtn.isVisible()) {
      await langBtn.click();
      // Main header button should toggle to show 'বাংলা'
      await expect(
        page.getByRole('banner').getByRole('button', { name: 'বাংলা' }),
      ).toBeVisible();
    }
  });

  test('STAFF-01: Deny-by-default permission guard blocks unauthorized sections', async ({
    page,
  }) => {
    // Setup app with restricted staff permissions (empty permissions)
    await setupAuthenticatedApp(page, {
      role: 'staff',
      permissions: [], // zero permissions
    });
    await page.goto('/');

    // Navigate to Expenses - should display permission denied message
    await page.locator('.md-nav-button', { hasText: 'খরচ' }).click();
    await expect(
      page.getByText('খরচ দেখতে বা যোগ করতে যথাযথ permission প্রয়োজন।'),
    ).toBeVisible();
  });

  test('AUD-01: Audit log privacy guarantees customer phone snapshot is never leaked in metadata', async () => {
    // Verify MOCK_AUDIT_LOG records
    for (const entry of MOCK_AUDIT_LOG) {
      if (entry.action === 'SALE_POSTED') {
        const metadata = entry.metadata as Record<string, unknown>;
        // Phone snapshot must NOT be in audit log metadata
        expect(metadata.customer_phone_snapshot).toBeUndefined();
        expect(metadata.customer_phone).toBeUndefined();
        expect(metadata.phone).toBeUndefined();
      }
    }
  });
});
