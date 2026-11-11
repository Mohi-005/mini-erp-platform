import { test, expect } from '@playwright/test';
import { setupAuthenticatedApp } from './helpers/mock-env';

test.describe('Authentication & Session (AUTH-01 to AUTH-06)', () => {
  test('AUTH-01: Login form display & password eye toggle', async ({
    page,
  }) => {
    // Navigate without authenticated session
    await page.goto('/');

    const emailInput = page
      .locator('input[type="email"], input[autocomplete="email"], input#email')
      .first();
    const passwordInput = page
      .locator('input[autocomplete="current-password"], input[type="password"]')
      .first();

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // Click password visibility toggle button
    const toggleButton = page
      .locator(
        'button.password-visibility, button[aria-label*="পাসওয়ার্ড"], button[aria-label*="password"]',
      )
      .first();
    if (await toggleButton.isVisible()) {
      await toggleButton.click();
      await expect(passwordInput).toHaveAttribute('type', 'text');
      await toggleButton.click();
      await expect(passwordInput).toHaveAttribute('type', 'password');
    }
  });

  test('AUTH-03: Invalid credentials shows error message', async ({ page }) => {
    await page.route('**/auth/v1/token*', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'invalid_grant',
          error_description: 'Invalid login credentials',
        }),
      });
    });

    await page.goto('/');
    const emailInput = page
      .locator('input[type="email"], input[autocomplete="email"], input#email')
      .first();
    const passwordInput = page
      .locator('input[autocomplete="current-password"], input[type="password"]')
      .first();
    const submitButton = page
      .locator('button.auth-primary, button[type="submit"]')
      .first();

    await emailInput.fill('invalid@example.com');
    await passwordInput.fill('WrongPassword123');
    await submitButton.click();

    // Verify error notification or notice
    const notice = page
      .locator('.notice, [role="status"], [role="alert"]')
      .first();
    await expect(notice).toBeVisible({ timeout: 5000 });
  });

  test('AUTH-04 & AUTH-05: Route protection and logout', async ({ page }) => {
    await setupAuthenticatedApp(page);
    await page.goto('/');

    // Check that we are inside authenticated workspace
    await expect(
      page.locator('.md-layout, .ops-dashboard, main'),
    ).toBeVisible();

    // Find and click logout button
    const logoutBtn = page
      .getByRole('button', { name: /লগআউট|Logout/i })
      .first();
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
      // Should return to login form
      await expect(
        page.locator('input[autocomplete="email"], input[type="email"]'),
      ).toBeVisible();
    }
  });
});

test.describe('Home Dashboard & Navigation (NAV-01 to NAV-03)', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedApp(page);
    await page.goto('/');
  });

  test('NAV-01: Home dashboard overview renders welcome and summary cards', async ({
    page,
  }) => {
    // Assert dashboard elements are loaded
    await expect(page.locator('.ops-dashboard, .md-layout')).toBeVisible();
    // Verify business title or header
    const brandOrHeader = page.locator('text=হিসাব').first();
    await expect(brandOrHeader).toBeVisible();
  });

  test('NAV-02: Navigation menu order and absence of DemoApp redirect', async ({
    page,
  }) => {
    const navButtons = page.locator('.md-nav-button');
    await expect(navButtons.first()).toBeVisible();

    // Verify all 11 primary navigation menu titles are present in approved order
    const expectedLabels = [
      'হোম',
      'দোকানের তালিকা',
      'বিক্রি',
      'কেনাকাটা',
      'পণ্য ও স্টক',
      'ক্রেতার বাকি',
      'খরচ',
      'লাভের হিসাব',
      'রিপোর্ট',
      'ইনভয়েস ও লেনদেন',
      'সেটিংস',
    ];

    for (let i = 0; i < expectedLabels.length; i++) {
      const button = navButtons.nth(i);
      await expect(button).toContainText(expectedLabels[i]);
    }

    // Verify no Demo boundary banner is active
    await expect(page.locator('.account-boundary')).not.toBeVisible();
  });

  test('NAV-03: Quick jump navigation to Sales and Purchases', async ({
    page,
  }) => {
    // Click on Sales navigation
    const salesNavBtn = page.locator('.md-nav-button', { hasText: 'বিক্রি' });
    await salesNavBtn.click();
    // Sales workspace or panel should open
    await expect(
      page
        .locator('.ops-sales-layout, .ops-card, h2:has-text("বিক্রি")')
        .first(),
    ).toBeVisible({ timeout: 5000 });

    // Click on Purchases navigation
    const purchasesNavBtn = page.locator('.md-nav-button', {
      hasText: 'কেনাকাটা',
    });
    await purchasesNavBtn.click();
    // Purchases workspace or panel should open
    await expect(
      page
        .locator('.ops-purchase-layout, .ops-card, h2:has-text("কেনাকাটা")')
        .first(),
    ).toBeVisible({ timeout: 5000 });
  });
});
