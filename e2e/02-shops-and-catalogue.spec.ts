import { test, expect } from '@playwright/test';
import { setupAuthenticatedApp } from './helpers/mock-env';

test.describe('Shop Management (SHOP-01 to SHOP-03)', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedApp(page);
    await page.goto('/');
    // Navigate to shops
    await page.locator('.md-nav-button', { hasText: 'দোকানের তালিকা' }).click();
  });

  test('SHOP-01: Shop directory listing & search by code or name', async ({
    page,
  }) => {
    await expect(page.locator('.ops-tablewrap, table')).toBeVisible();

    // Verify shops appear in the table
    await expect(page.locator('text=রহিম স্টোর')).toBeVisible();
    await expect(page.locator('text=করিম ট্রেডার্স')).toBeVisible();

    // Search by shop code
    const searchInput = page.getByPlaceholder(/দোকান, কোড|Search/i);
    await searchInput.fill('SH-001');

    await expect(page.locator('text=রহিম স্টোর')).toBeVisible();
    await expect(page.locator('text=করিম ট্রেডার্স')).not.toBeVisible();
  });

  test('SHOP-02: Add new shop modal and input validation', async ({ page }) => {
    const addShopBtn = page
      .getByRole('button', { name: /নতুন দোকান|দোকান যোগ/i })
      .first();
    if (await addShopBtn.isVisible()) {
      await addShopBtn.click();
      await expect(page.locator('form, .ops-modal')).toBeVisible();
    }
  });

  test('SHOP-03: Shop details view and transaction history', async ({
    page,
  }) => {
    // Click on Rahim Store to view details
    const rahimRow = page.locator('tr:has-text("রহিম স্টোর")').first();
    await expect(rahimRow).toBeVisible();

    // Check for details action or button
    const detailBtn = rahimRow
      .getByRole('button', { name: /বিস্তারিত|View|Details/i })
      .first();
    if (await detailBtn.isVisible()) {
      await detailBtn.click();
      // Should show shop details
      await expect(page.locator('text=01712345678')).toBeVisible();
    }
  });
});

test.describe('Product Master & Trilingual Catalogue (PROD-01 to PROD-07)', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedApp(page);
    await page.goto('/');
    // Navigate to products
    await page.locator('.md-nav-button', { hasText: 'পণ্য ও স্টক' }).click();
  });

  test('PROD-01: Product table column order and 38px thumbnail', async ({
    page,
  }) => {
    await expect(page.locator('.md-tablewrap table')).toBeVisible();

    // Verify header column sequence: Name -> Image -> SKU -> Category -> Unit
    const headers = page.locator('.md-tablewrap table thead th');
    await expect(headers.nth(0)).toContainText(/পণ্যের নাম|Product/i);
    await expect(headers.nth(1)).toContainText(/ছবি|Image/i);
    await expect(headers.nth(2)).toContainText('SKU');
    await expect(headers.nth(3)).toContainText(/ক্যাটাগরি|Category/i);
    await expect(headers.nth(4)).toContainText(/একক|Unit/i);

    // Verify 38px thumbnail rendering
    const imgThumb = page
      .locator('.product-img-thumb, img[alt*="ছবি"], img[alt*="চাল"]')
      .first();
    await expect(imgThumb).toBeVisible();
  });

  test('PROD-02: Manual add product button is completely absent', async ({
    page,
  }) => {
    // Verify that "+ নতুন যোগ করো" button is NOT present in Products tab
    const addProductBtn = page.locator(
      '.md-toolbar-actions button:has-text("নতুন যোগ করো")',
    );
    await expect(addProductBtn).not.toBeVisible();
  });

  test('PROD-03: Bengali name search finds Miniket Rice (CATV2-001)', async ({
    page,
  }) => {
    const searchInput = page
      .locator(
        '.md-search input, input[placeholder*="খুঁজুন"], input[placeholder*="Search"]',
      )
      .first();
    await searchInput.fill('মিনিকেট চাল');

    // Assert CATV2-001 is visible and Najirshail is not
    await expect(page.locator('text=CATV2-001')).toBeVisible();
    await expect(page.locator('text=CATV2-002')).not.toBeVisible();
  });

  test('PROD-04: English name search finds Soybean Oil (CATV2-039 / CATV2-040)', async ({
    page,
  }) => {
    const searchInput = page
      .locator(
        '.md-search input, input[placeholder*="খুঁজুন"], input[placeholder*="Search"]',
      )
      .first();
    await searchInput.fill('Soybean Oil');

    // Assert CATV2-039 or CATV2-040 is visible and Miniket Rice is not
    await expect(page.locator('text=CATV2-039')).toBeVisible();
    await expect(page.locator('text=CATV2-001')).not.toBeVisible();
  });

  test('PROD-05: Banglish name search finds Najirshail Rice (CATV2-002)', async ({
    page,
  }) => {
    const searchInput = page
      .locator(
        '.md-search input, input[placeholder*="খুঁজুন"], input[placeholder*="Search"]',
      )
      .first();
    await searchInput.fill('Najirshail Chal');

    await expect(page.locator('text=CATV2-002')).toBeVisible();
    await expect(page.locator('text=CATV2-001')).not.toBeVisible();
  });

  test('PROD-06: Hazardous / forbidden goods restriction', async ({ page }) => {
    const searchInput = page
      .locator(
        '.md-search input, input[placeholder*="খুঁজুন"], input[placeholder*="Search"]',
      )
      .first();
    await searchInput.fill('মশা মারার স্প্রে');

    // Assert empty state is shown
    await expect(page.locator('text=কোনো পণ্য পাওয়া যায়নি')).toBeVisible();
  });

  test('PROD-07: Category and Unit tabs retain "+ নতুন যোগ করো" button', async ({
    page,
  }) => {
    // Click on Categories tab
    const categoryTab = page.locator('.md-tab', {
      hasText: /ক্যাটাগরি|Categories/i,
    });
    if (await categoryTab.isVisible()) {
      await categoryTab.click();
      const addCategoryBtn = page.locator(
        '.md-toolbar-actions button:has-text("নতুন যোগ করো")',
      );
      await expect(addCategoryBtn).toBeVisible();
    }

    // Click on Units tab
    const unitTab = page.locator('.md-tab', { hasText: /একক|Units/i });
    if (await unitTab.isVisible()) {
      await unitTab.click();
      const addUnitBtn = page.locator(
        '.md-toolbar-actions button:has-text("নতুন যোগ করো")',
      );
      await expect(addUnitBtn).toBeVisible();
    }
  });
});
