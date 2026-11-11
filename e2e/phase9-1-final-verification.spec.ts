import { test, expect } from '@playwright/test';
import { setupAuthenticatedApp } from './helpers/mock-env';

const VIEWPORTS = [
  { name: '360px (Small Mobile)', width: 360, height: 740, isMobile: true },
  { name: '375px (iPhone SE)', width: 375, height: 667, isMobile: true },
  { name: '390px (iPhone 12/13/14)', width: 390, height: 844, isMobile: true },
  { name: '430px (iPhone Pro Max)', width: 430, height: 932, isMobile: true },
  {
    name: '1280px (Standard Desktop)',
    width: 1280,
    height: 800,
    isMobile: false,
  },
  { name: '1440px (Wide Desktop)', width: 1440, height: 900, isMobile: false },
];

test.describe('PHASE 9.1: Final Responsive & Navigation & Brand Note Verification', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedApp(page);
    page.on('dialog', (dialog) => dialog.accept());
  });

  // --------------------------------------------------------------------------
  // 1. Mobile Navigation Label, Order & Wrap Verification
  // --------------------------------------------------------------------------
  for (const vp of VIEWPORTS.filter((v) => v.isMobile)) {
    test(`Mobile Navigation: Label "দোকানের তালিকা", Row 1/2 distribution & zero horizontal scroll at ${vp.width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');

      const nav = page.locator('.md-layout .md-nav');
      await expect(nav).toBeVisible();

      // Check no horizontal scroll on nav or body
      const navOverflow = await nav.evaluate((el) => ({
        scrollWidth: el.scrollWidth,
        clientWidth: el.clientWidth,
      }));
      expect(navOverflow.scrollWidth).toBeLessThanOrEqual(
        navOverflow.clientWidth + 1,
      );

      const pageOverflow = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
      }));
      expect(pageOverflow.scrollWidth).toBeLessThanOrEqual(
        pageOverflow.innerWidth + 1,
      );

      // Verify all 11 buttons in exact required order
      const navButtons = nav.locator('.md-nav-button');
      await expect(navButtons).toHaveCount(11);

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
        await expect(navButtons.nth(i)).toContainText(expectedLabels[i]);
      }

      // Verify Row 1: Exactly হোম, দোকানের তালিকা, বিক্রি
      const box0 = await navButtons.nth(0).boundingBox();
      const box1 = await navButtons.nth(1).boundingBox();
      const box2 = await navButtons.nth(2).boundingBox();
      const box3 = await navButtons.nth(3).boundingBox();

      expect(box0).not.toBeNull();
      expect(box1).not.toBeNull();
      expect(box2).not.toBeNull();
      expect(box3).not.toBeNull();

      // Dynamic row packing: at widths < 400px, 3 items fit on Row 1 and Item 3 (কেনাকাটা) begins Row 2.
      // At wider viewports (e.g. 430px), 4 items naturally fit on Row 1.
      if (vp.width < 400) {
        expect(Math.abs(box0!.y - box1!.y)).toBeLessThan(5);
        expect(Math.abs(box0!.y - box2!.y)).toBeLessThan(5);
        expect(box3!.y).toBeGreaterThan(box0!.y + 10);
      } else {
        expect(Math.abs(box0!.y - box1!.y)).toBeLessThan(5);
        expect(Math.abs(box0!.y - box2!.y)).toBeLessThan(5);
        expect(Math.abs(box0!.y - box3!.y)).toBeLessThan(5);
      }

      // Test active highlight follows selected item
      // 1. Initial active is 'হোম'
      await expect(navButtons.nth(0)).toHaveAttribute('aria-current', 'page');
      let colors = await navButtons.nth(0).evaluate((el) => {
        const s = window.getComputedStyle(el);
        return { bg: s.backgroundColor, color: s.color };
      });
      expect(colors.bg).toBe('rgb(200, 232, 213)'); // #c8e8d5
      expect(colors.color).toBe('rgb(13, 66, 49)'); // #0d4231

      // 2. Click 'দোকানের তালিকা' -> active moves
      await navButtons.nth(1).click();
      await expect(navButtons.nth(1)).toHaveAttribute('aria-current', 'page');
      await expect(navButtons.nth(0)).not.toHaveAttribute(
        'aria-current',
        'page',
      );
      colors = await navButtons.nth(1).evaluate((el) => {
        const s = window.getComputedStyle(el);
        return { bg: s.backgroundColor, color: s.color };
      });
      expect(colors.bg).toBe('rgb(200, 232, 213)');
      expect(colors.color).toBe('rgb(13, 66, 49)');

      // 3. Click 'কেনাকাটা' -> active moves
      await navButtons.nth(3).click();
      await expect(navButtons.nth(3)).toHaveAttribute('aria-current', 'page');
      await expect(navButtons.nth(1)).not.toHaveAttribute(
        'aria-current',
        'page',
      );
      colors = await navButtons.nth(3).evaluate((el) => {
        const s = window.getComputedStyle(el);
        return { bg: s.backgroundColor, color: s.color };
      });
      expect(colors.bg).toBe('rgb(200, 232, 213)');
      expect(colors.color).toBe('rgb(13, 66, 49)');
    });
  }

  // --------------------------------------------------------------------------
  // 2. Desktop Navigation Preservation
  // --------------------------------------------------------------------------
  for (const vp of VIEWPORTS.filter((v) => !v.isMobile)) {
    test(`Desktop Navigation: Sidebar design preserved at ${vp.width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');

      const navButtons = page.locator('.md-layout .md-nav .md-nav-button');
      await expect(navButtons.first()).toBeVisible();

      // Second button is 'দোকানের তালিকা'
      await expect(navButtons.nth(1)).toContainText('দোকানের তালিকা');

      // Active button has desktop mint background rgb(232, 243, 236)
      const colors = await navButtons.nth(0).evaluate((el) => {
        const s = window.getComputedStyle(el);
        return { bg: s.backgroundColor, color: s.color };
      });
      expect(colors.bg).toBe('rgb(232, 243, 236)');
    });
  }

  // --------------------------------------------------------------------------
  // 3. Responsive Purchase Page Layout: Mobile vs Desktop
  // --------------------------------------------------------------------------
  for (const vp of VIEWPORTS) {
    test(`Purchase Page Layout at ${vp.width}px (${vp.isMobile ? 'Mobile Vertical' : 'Desktop 2-Col'})`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');
      await page.locator('.md-nav-button', { hasText: 'কেনাকাটা' }).click();

      const productsHeader = page.locator('.ops-purchase-products h3', {
        hasText: 'পণ্য বেছে নাও',
      });
      const searchBox = page.locator('.ops-purchase-products .ops-search');
      const cartSection = page.locator('.ops-purchase-cart');
      const supplierSection = page.locator('.ops-purchase-suppliers');

      await expect(productsHeader).toBeVisible();
      await expect(searchBox).toBeVisible();
      await expect(cartSection).toBeVisible();
      await expect(supplierSection).toBeVisible();

      // Check no horizontal page overflow
      const pageOverflow = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
      }));
      expect(pageOverflow.scrollWidth).toBeLessThanOrEqual(
        pageOverflow.innerWidth + 1,
      );

      // Check recommendation grid is absent by default
      await expect(page.locator('.ops-products-grid')).not.toBeVisible();

      const boxProducts = await productsHeader.boundingBox();
      const boxSearch = await searchBox.boundingBox();
      const boxCart = await cartSection.boundingBox();
      const boxSuppliers = await supplierSection.boundingBox();

      expect(boxProducts).not.toBeNull();
      expect(boxSearch).not.toBeNull();
      expect(boxCart).not.toBeNull();
      expect(boxSuppliers).not.toBeNull();

      if (vp.isMobile) {
        // Mobile Vertical Hierarchy:
        // Heading (পণ্য বেছে নাও) -> Search -> Cart -> Supplier List
        expect(boxProducts!.y).toBeLessThan(boxSearch!.y);
        expect(boxSearch!.y).toBeLessThan(boxCart!.y);
        expect(boxCart!.y).toBeLessThan(boxSuppliers!.y);
      } else {
        // Desktop 2-Column:
        // Cart is positioned to the right of products & suppliers
        expect(boxCart!.x).toBeGreaterThan(boxProducts!.x);
        expect(boxSuppliers!.y).toBeGreaterThan(boxProducts!.y);
      }
    });
  }

  // --------------------------------------------------------------------------
  // 4. Brand Note UI & Invoice Display Isolation (Purchase vs Sale)
  // --------------------------------------------------------------------------
  test('Brand Note: Appears on Purchase invoice; completely absent on Sales invoice and empty note', async ({
    page,
  }) => {
    await page.goto('/');

    // Navigate to Invoices & Transactions
    await page
      .locator('.md-nav-button', { hasText: 'ইনভয়েস ও লেনদেন' })
      .click();

    // 1. Inspect Purchase Invoice (MOCK_PURCHASES has brand_note: 'PRAN')
    const purchaseRow = page.locator('tr', { hasText: 'ক্রয়' }).first();
    await expect(purchaseRow).toBeVisible();

    const purchaseDetailsBtn = purchaseRow.locator('button', {
      hasText: /বিস্তারিত|Details/i,
    });
    await purchaseDetailsBtn.click();

    const invoiceSection = page.locator('.ops-printable');
    await expect(invoiceSection).toBeVisible();

    // Purchase Invoice displays 'ব্র্যান্ড: PRAN'
    const brandRow = invoiceSection.locator('p', { hasText: /ব্র্যান্ড/i });
    await expect(brandRow).toBeVisible();
    await expect(brandRow).toContainText('PRAN');

    // Close details
    await invoiceSection.getByRole('button', { name: /বন্ধ|Close/i }).click();
    await expect(invoiceSection).not.toBeVisible();

    // 2. Inspect Sales Invoice
    const saleRow = page.locator('tr', { hasText: 'বিক্রি' }).first();
    await expect(saleRow).toBeVisible();

    const saleDetailsBtn = saleRow.locator('button', {
      hasText: /বিস্তারিত|Details/i,
    });
    await saleDetailsBtn.click();

    await expect(invoiceSection).toBeVisible();

    // Sales Invoice must NEVER display 'ব্র্যান্ড'
    const saleBrandRow = invoiceSection.locator('p', { hasText: /ব্র্যান্ড/i });
    await expect(saleBrandRow).toHaveCount(0);
  });

  // --------------------------------------------------------------------------
  // 5. Preservation Checks: Profit Warning & Recent Search 9-Item
  // --------------------------------------------------------------------------
  test('Preservation: Profit Estimator warning and Recent Search 9 items', async ({
    page,
  }) => {
    await page.goto('/');

    // A. Profit Estimator Warning
    await page.locator('.md-nav-button', { hasText: 'লাভের হিসাব' }).click();
    const buyQty = page.getByLabel(/কেনার পরিমাণ|Purchase quantity/i);
    const sellQty = page.getByLabel(
      /বিক্রির প্রত্যাশিত পরিমাণ|Expected quantity to sell/i,
    );

    await buyQty.fill('10');
    await sellQty.fill('12');

    const warning = page.locator('.ops-estimator-warning');
    await expect(warning).toBeVisible();
    await expect(warning).toContainText(
      'বিক্রির পরিমাণ কেনার পরিমাণের চেয়ে বেশি। অনুগ্রহ করে কেনার পরিমাণ বৃদ্ধি করুন অথবা বিক্রির পরিমাণ কমিয়ে দিন।',
    );

    // B. Purchases Recent Search 9-Item Limit
    await page.locator('.md-nav-button', { hasText: 'কেনাকাটা' }).click();
    const searchInput = page.getByPlaceholder(
      /পণ্যের নাম\/SKU বা ক্যাটালগ খুঁজুন|Search product name/i,
    );

    // Search and select product
    await searchInput.fill('মিনিকেট');
    await page.locator('.ops-products-grid .ops-product-card').first().click();
    await searchInput.fill('');

    // Recent items chips visible
    const recentChips = page.locator('.ops-chip:has(.product-img-thumb)');
    const count = await recentChips.count();
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThanOrEqual(9);
  });
});
