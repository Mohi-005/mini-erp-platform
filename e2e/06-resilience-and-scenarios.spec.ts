import { test, expect } from '@playwright/test';
import { setupAuthenticatedApp } from './helpers/mock-env';

test.describe('Product Master Edit, Archive & Refresh', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedApp(page);
    await page.goto('/');
    // Navigate to 'পণ্য ও স্টক' -> 'পণ্য মাস্টার'
    await page.locator('.md-nav-button', { hasText: 'পণ্য ও স্টক' }).click();
  });

  test('PROD-08: Product edit modal opens and allows updating details', async ({
    page,
  }) => {
    // Click 'এডিট' on the first product row
    const editBtn = page
      .locator('.md-rowactions button:has-text("এডিট")')
      .first();
    await expect(editBtn).toBeVisible();
    await editBtn.click();

    // Editor modal / form should appear
    await expect(page.locator('form.md-form, .md-modal').first()).toBeVisible();
    await expect(
      page.getByLabel(/পণ্যের নাম \(বাংলা\)|Product name \(BN\)/i),
    ).toBeVisible();
  });

  test('PROD-09: Archive button is available on products and toggles archive status', async ({
    page,
  }) => {
    // Intercept PATCH to products table for archive
    let capturedPatch: Record<string, unknown> | null = null;
    await page.route('**/rest/v1/products*', async (route) => {
      if (route.request().method() === 'PATCH') {
        capturedPatch = route.request().postDataJSON();
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { id: 'prod-01', archived_at: '2026-11-09T00:00:00Z' },
          ]),
        });
      } else {
        await route.continue();
      }
    });

    const archiveBtn = page
      .locator('.md-rowactions button:has-text("আর্কাইভ")')
      .first();
    await expect(archiveBtn).toBeVisible();
    await archiveBtn.click();

    expect(capturedPatch).not.toBeNull();
    expect(
      (capturedPatch as Record<string, unknown>).archived_at,
    ).toBeDefined();
  });

  test('PROD-10: Master data refresh button updates product listing', async ({
    page,
  }) => {
    let fetchCount = 0;
    await page.route('**/rest/v1/products*', async (route) => {
      fetchCount++;
      await route.continue();
    });

    const refreshBtn = page
      .getByRole('button', { name: /রিফ্রেশ|Refresh/i })
      .first();
    await refreshBtn.click();
    expect(fetchCount).toBeGreaterThan(0);
  });
});

test.describe('Image Fallback & RPC Resilience', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedApp(page);
  });

  test('IMG-01: Broken image loads graceful fallback placeholder (📦)', async ({
    page,
  }) => {
    // Simulate image error by routing WebP storage URLs to 404
    await page.route('**/storage/v1/object/public/**', async (route) => {
      await route.fulfill({ status: 404 });
    });

    await page.goto('/');
    await page.locator('.md-nav-button', { hasText: 'কেনাকাটা' }).click();
    await page.locator('.ops-search').fill('মিনিকেট');

    // Product card should contain fallback placeholder
    const fallback = page.locator('.product-img-fallback').first();
    await expect(fallback).toBeVisible();
    await expect(fallback).toContainText('📦');
  });

  test('ERR-01: RPC server error displays error notification and prevents white screen crash', async ({
    page,
  }) => {
    let alertMsg = '';
    page.on('dialog', async (d) => {
      alertMsg = d.message();
      await d.accept();
    });

    // Mock RPC failure
    await page.route('**/rpc/post_sale', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 'P0001',
          message: 'ডেটাবেস ত্রুটি: লেনদেন সম্পন্ন করা যায়নি।',
        }),
      });
    });

    await page.goto('/');
    await page.locator('.md-nav-button', { hasText: 'বিক্রি' }).click();

    // Add item to cart
    await page.locator('.ops-product-card').first().click();

    // Pay full cash
    await page.getByLabel('এখন পরিশোধ').fill('70');

    // Confirm sale
    const submitBtn = page.getByRole('button', {
      name: /যাচাই করে বিক্রি নিশ্চিত করুন|Review and confirm sale/i,
    });
    await submitBtn.click();

    // App should not crash; alert or error message is displayed
    expect(alertMsg.length).toBeGreaterThan(0);
    // Page body remains mounted
    await expect(page.locator('.md-nav')).toBeVisible();
  });
});

test.describe('Mobile Viewport & Cross-Module Responsive Layout', () => {
  test.use({ viewport: { width: 390, height: 844 } }); // iPhone 12 / Modern mobile size

  test('MOB-01: Responsive layout on mobile device (390x844)', async ({
    page,
  }) => {
    await setupAuthenticatedApp(page);
    await page.goto('/');

    // Verify main navigation buttons are accessible
    await expect(page.locator('.md-nav-button').first()).toBeVisible();

    // Navigate to Sales on mobile
    await page.locator('.md-nav-button', { hasText: 'বিক্রি' }).click();
    await expect(
      page.locator('main h2').filter({ hasText: 'বিক্রি' }),
    ).toBeVisible();

    // Product cards are visible on mobile
    await expect(page.locator('.ops-product-card').first()).toBeVisible();

    // Navigate to Stock Ledger on mobile
    await page.locator('.md-nav-button', { hasText: 'পণ্য ও স্টক' }).click();
    await page.locator('.ops-chip', { hasText: 'স্টক লেজার' }).click();

    // Table container exists
    const tableWrap = page.locator('.ops-table-wrap').first();
    await expect(tableWrap).toBeVisible();
  });
});
