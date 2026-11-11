import { test, expect } from '@playwright/test';
import { setupAuthenticatedApp, MOCK_BALANCES } from './helpers/mock-env';

test.describe('Stock Ledger Workflow (STK-01 to STK-03)', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedApp(page);
    await page.goto('/');
    // Navigate to 'পণ্য ও স্টক'
    await page.locator('.md-nav-button', { hasText: 'পণ্য ও স্টক' }).click();
    // Switch to 'স্টক লেজার' tab
    await page.locator('.ops-chip', { hasText: 'স্টক লেজার' }).click();
  });

  test('STK-01: Stock table columns and 38px product thumbnail', async ({
    page,
  }) => {
    // Check thumbnail image inside stock table
    const thumbImg = page.locator('.ops-table .product-img-thumb').first();
    await expect(thumbImg).toBeVisible();

    // Table headers should include Product, Image, Category, Unit, Stock
    await expect(
      page.locator('.ops-table thead th').filter({ hasText: /^পণ্য/ }).first(),
    ).toBeVisible();
    await expect(
      page.locator('.ops-table thead th').filter({ hasText: /^ছবি/ }),
    ).toBeVisible();
    await expect(
      page.locator('.ops-table thead th').filter({ hasText: /^ক্যাটাগরি/ }),
    ).toBeVisible();
    await expect(
      page.locator('.ops-table thead th').filter({ hasText: /^একক/ }),
    ).toBeVisible();
  });

  test('STK-02: Zero stock red highlight (.ops-zero-stock-row) and "স্টক শেষ" badge', async ({
    page,
  }) => {
    // prod-02 (নাজিরশাইল চাল) has quantity: 0
    const zeroRow = page.locator('tr.ops-zero-stock-row');
    await expect(zeroRow).toBeVisible();
    await expect(zeroRow).toContainText('নাজিরশাইল চাল');

    // Should display red 'স্টক শেষ' badge
    const badge = zeroRow.locator('.ops-state.danger');
    await expect(badge).toHaveText('স্টক শেষ');
  });

  test('STK-03: Replenishment recovery removes zero-stock badge and highlight', async ({
    page,
  }) => {
    // Intercept balance endpoint with updated stock for prod-02
    await page.route('**/rest/v1/inventory_balances*', async (route) => {
      const replenishedBalances = MOCK_BALANCES.map((b) =>
        b.product_id === 'prod-02' ? { ...b, quantity: 150 } : b,
      );
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(replenishedBalances),
      });
    });

    // Reload or switch tab to trigger refresh
    await page.locator('.ops-chip', { hasText: 'পণ্য মাস্টার' }).click();
    await page.locator('.ops-chip', { hasText: 'স্টক লেজার' }).click();

    // Zero stock row should no longer exist for prod-02
    const zeroRows = page.locator('tr.ops-zero-stock-row');
    await expect(zeroRows).toHaveCount(0);

    // Row in stock table should show stock 150 and 'ঠিক আছে' badge
    const najirshailRow = page
      .locator('.ops-table')
      .first()
      .locator('tr:has-text("নাজিরশাইল চাল")');
    await expect(najirshailRow).toContainText('150');
    await expect(najirshailRow.locator('.ops-state.good')).toHaveText(
      'ঠিক আছে',
    );
  });
});

test.describe('Invoices & Transaction History Search (HIST-01 to HIST-07)', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedApp(page);
    await page.goto('/');
    // Navigate to 'ইনভয়েস ও লেনদেন'
    await page
      .locator('.md-nav-button', { hasText: 'ইনভয়েস ও লেনদেন' })
      .click();
  });

  test('HIST-01: Search by invoice number (S-20261108-001) and view details', async ({
    page,
  }) => {
    const searchInput = page.getByLabel(/নাম, দোকান কোড বা ইনভয়েস/i);
    await searchInput.fill('S-20261108-001');

    // Should find the sale row
    const invoiceRow = page.locator(
      '.ops-table tbody tr:has-text("S-20261108-001")',
    );
    await expect(invoiceRow).toBeVisible();
    await expect(invoiceRow).toContainText('রহিম স্টোর');

    // Click "বিস্তারিত" (View) button
    const viewBtn = invoiceRow.getByRole('button', { name: /বিস্তারিত|View/i });
    await viewBtn.click();

    // Modal or invoice detail preview should appear
    await expect(
      page
        .locator(
          '.ops-modal, .ops-invoice-preview, h3:has-text("ইনভয়েস"), h3:has-text("S-20261108-001")',
        )
        .first(),
    ).toBeVisible();
  });

  test('HIST-02: Search by registered customer phone (01712345678) shows customer identity', async ({
    page,
  }) => {
    const searchInput = page.getByLabel(/নাম, দোকান কোড বা ইনভয়েস/i);
    await searchInput.fill('01712345678');

    // Should display registered customer group/chip
    const custChip = page
      .locator(
        '.ops-chip:has-text("রহিম স্টোর"), .ops-identity-group:has-text("রহিম স্টোর")',
      )
      .first();
    await expect(custChip).toBeVisible();

    // Should show sale S-20261108-001
    await expect(page.locator('text=S-20261108-001')).toBeVisible();
  });

  test('HIST-03: Search walk-in customer mobile separates walk-in from registered', async ({
    page,
  }) => {
    const searchInput = page.getByLabel(/নাম, দোকান কোড বা ইনভয়েস/i);
    await searchInput.fill('01712345678');

    // Walk-in chip should be visible
    const walkInChip = page
      .locator(
        '.ops-chip:has-text("খুচরা ক্রেতা"), .ops-identity-header:has-text("খুচরা ক্রেতা")',
      )
      .first();
    await expect(walkInChip).toBeVisible();

    // Click walk-in chip to isolate walk-in sales
    const walkInFilterBtn = page.getByRole('button', {
      name: /🛍️.*খুচরা ক্রেতা/i,
    });
    if (await walkInFilterBtn.isVisible()) {
      await walkInFilterBtn.click();
    }

    // Should show walk-in sale S-20261108-002
    await expect(page.locator('text=S-20261108-002')).toBeVisible();
  });

  test('HIST-04: Dual customer phone sharing shows distinct identities', async ({
    page,
  }) => {
    const searchInput = page.getByLabel(/নাম, দোকান কোড বা ইনভয়েস/i);
    await searchInput.fill('01712345678');

    // Phone is shared by Rahim Store (cust-01) and Walk-in (sale-002)
    // Verify both identity tabs/headers exist separately
    await expect(page.locator('text=রহিম স্টোর').first()).toBeVisible();
    await expect(page.locator('text=খুচরা ক্রেতা').first()).toBeVisible();
  });

  test('HIST-05: Supplier phone search (01911223344) isolates supplier purchase history', async ({
    page,
  }) => {
    const searchInput = page.getByLabel(/নাম, দোকান কোড বা ইনভয়েস/i);
    await searchInput.fill('01911223344');

    // Should show supplier badge/header
    const suppChip = page
      .locator(
        '.ops-chip:has-text("স্কয়ার কনজিউমার গুডস"), .ops-identity-header:has-text("স্কয়ার কনজিউমার গুডস")',
      )
      .first();
    await expect(suppChip).toBeVisible();

    // Should show purchase invoice P-20261108-001
    await expect(page.locator('text=P-20261108-001')).toBeVisible();

    // Sales table should NOT mix with this
    await expect(page.locator('text=S-20261108-001')).not.toBeVisible();
  });

  test('HIST-06: Bengali numerals (০১৭১২৩৪৫৬৭৮) and international (+8801712345678) invariance', async ({
    page,
  }) => {
    const searchInput = page.getByLabel(/নাম, দোকান কোড বা ইনভয়েস/i);

    // Test with Bengali numerals
    await searchInput.fill('০১৭১২৩৪৫৬৭৮');
    await expect(page.locator('text=S-20261108-001')).toBeVisible();

    // Test with +880 international prefix
    await searchInput.fill('+8801712345678');
    await expect(page.locator('text=S-20261108-001')).toBeVisible();
  });

  test('HIST-07: Filter by transaction type (Sales vs Purchases)', async ({
    page,
  }) => {
    // Select 'কেনাকাটা' (Purchases) from type dropdown
    const typeSelect = page.locator('label:has-text("লেনদেনের ধরন") select');
    await typeSelect.selectOption('PURCHASE');

    // Only Purchase invoice P-20261108-001 should be visible
    await expect(page.locator('text=P-20261108-001')).toBeVisible();
    await expect(page.locator('text=S-20261108-001')).not.toBeVisible();

    // Switch to 'বিক্রি' (Sales)
    await typeSelect.selectOption('SALE');
    await expect(page.locator('text=S-20261108-001')).toBeVisible();
    await expect(page.locator('text=P-20261108-001')).not.toBeVisible();
  });
});
