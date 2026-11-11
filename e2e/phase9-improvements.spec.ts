import { test, expect } from '@playwright/test';
import { setupAuthenticatedApp } from './helpers/mock-env';

test.describe('Phase 9 Improvements Verification', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedApp(page);
    page.on('dialog', (dialog) => dialog.accept());
  });

  // --------------------------------------------------------------------------
  // Change 1: Profit Warning Text
  // --------------------------------------------------------------------------
  test('Change 1: Exact Bengali text for quantity mismatch warning in Profit Estimator', async ({
    page,
  }) => {
    await page.goto('/');
    // Navigate to Profit Estimator
    await page.locator('.md-nav-button', { hasText: 'লাভের হিসাব' }).click();

    // Fill purchase quantity and higher sales quantity
    const buyQtyInput = page.getByLabel(/কেনার পরিমাণ|Purchase quantity/i);
    const sellQtyInput = page.getByLabel(
      /বিক্রির প্রত্যাশিত পরিমাণ|Expected quantity to sell/i,
    );

    await buyQtyInput.fill('10');
    await sellQtyInput.fill('15');

    // Expected exact warning text
    const expectedWarning =
      'বিক্রির পরিমাণ কেনার পরিমাণের চেয়ে বেশি। অনুগ্রহ করে কেনার পরিমাণ বৃদ্ধি করুন অথবা বিক্রির পরিমাণ কমিয়ে দিন।';

    const warningEl = page.locator('.ops-estimator-warning');
    await expect(warningEl).toBeVisible();
    await expect(warningEl).toContainText(expectedWarning);

    // Old text should NOT be present
    const oldWarning =
      'বিক্রির পরিমাণ কেনার পরিমাণের চেয়ে বেশি। কেনার পরিমাণ বাড়ান অথবা বিক্রির পরিমাণ কমান।';
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toContain(oldWarning);

    // When sell quantity is reduced, warning disappears
    await sellQtyInput.fill('8');
    await expect(warningEl).not.toBeVisible();
  });

  // --------------------------------------------------------------------------
  // Change 2: Remove Extra Large Purchase Recommendation Section
  // --------------------------------------------------------------------------
  test('Change 2: Purchase recommendation section absent when not searching; search & recent search preserved', async ({
    page,
  }) => {
    await page.goto('/');
    await page.locator('.md-nav-button', { hasText: 'কেনাকাটা' }).click();

    // 1. Without search query, the large product cards grid is NOT visible
    const productsGrid = page.locator('.ops-products-grid');
    await expect(productsGrid).not.toBeVisible();
    await expect(page.locator('.ops-product-card')).toHaveCount(0);

    // 2. Search input is visible
    const searchInput = page.getByPlaceholder(
      /পণ্যের নাম\/SKU বা ক্যাটালগ খুঁজুন|Search product name/i,
    );
    await expect(searchInput).toBeVisible();

    // 3. When search query entered, real search results appear
    await searchInput.fill('মিনিকেট');
    await expect(productsGrid).toBeVisible();
    const searchCards = page.locator('.ops-products-grid .ops-product-card');
    await expect(searchCards.first()).toBeVisible();

    // 4. Clicking the card adds to cart
    await searchCards.first().click();
    await expect(page.locator('.ops-cart-item')).toHaveCount(1);

    // 5. Clearing search reveals Recent Search chip
    await searchInput.fill('');
    await expect(productsGrid).not.toBeVisible();
    const recentChip = page.locator('.ops-chip').first();
    await expect(recentChip).toBeVisible();
    await expect(recentChip).toContainText('মিনিকেট');
  });

  // --------------------------------------------------------------------------
  // Change 3: Optional Purchase Note / Brand Name
  // --------------------------------------------------------------------------
  test('Change 3: Purchase Cart Note field below Reference, RPC persistence & Invoice rendering', async ({
    page,
  }) => {
    let capturedRpcArgs: Record<string, unknown> | null = null;
    await page.route('**/rpc/post_purchase', async (route) => {
      capturedRpcArgs = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'p-phase9-test-id',
          invoice_no: 'P-20261111-0001',
        }),
      });
    });

    await page.goto('/');
    await page.locator('.md-nav-button', { hasText: 'কেনাকাটা' }).click();

    // Add a product to cart
    const searchInput = page.getByPlaceholder(
      /পণ্যের নাম\/SKU বা ক্যাটালগ খুঁজুন|Search product name/i,
    );
    await searchInput.fill('মিনিকেট');
    await page.locator('.ops-products-grid .ops-product-card').first().click();

    // Check Note field in Purchase cart
    const referenceField = page.getByLabel(
      /রেফারেন্স \/ চালান নম্বর|Reference \/ supplier bill no\./i,
    );
    await expect(referenceField).toBeVisible();

    const noteField = page.getByPlaceholder(
      'ব্র্যান্ডের নাম লিখুন (যেমন: PRAN)',
    );
    await expect(noteField).toBeVisible();

    // Verify DOM order: Note field is immediately below Reference field
    const refBox = await referenceField.boundingBox();
    const noteBox = await noteField.boundingBox();
    expect(refBox).not.toBeNull();
    expect(noteBox).not.toBeNull();
    expect(noteBox!.y).toBeGreaterThan(refBox!.y);

    // Fill reference and brand note
    await referenceField.fill('REF-P9-001');
    await noteField.fill('PRAN');

    // Select supplier
    const supplierSelect = page.getByRole('combobox', { name: /সরবরাহকারী/i });
    await supplierSelect.selectOption({ label: 'স্কয়ার কনজিউমার গুডস' });

    // Submit purchase
    const confirmBtn = page.getByRole('button', {
      name: /যাচাই করে কেনাকাটা নিশ্চিত করুন|Review and confirm purchase/i,
    });
    await confirmBtn.click();

    // Verify RPC payload includes p_brand_note: "PRAN"
    expect(capturedRpcArgs).not.toBeNull();
    expect((capturedRpcArgs as Record<string, unknown>).p_brand_note).toBe(
      'PRAN',
    );
    expect((capturedRpcArgs as Record<string, unknown>).p_reference_no).toBe(
      'REF-P9-001',
    );

    // Now test invoice view
    // Navigate to Invoices & Transactions
    await page
      .locator('.md-nav-button', { hasText: 'ইনভয়েস ও লেনদেন' })
      .click();

    // Click on details button of purchase row
    const detailsBtn = page
      .locator('tr', { hasText: 'ক্রয়' })
      .locator('button', { hasText: /বিস্তারিত|Details/i })
      .first();
    await expect(detailsBtn).toBeVisible();
    await detailsBtn.click();

    const invoiceSection = page.locator('.ops-printable');
    await expect(invoiceSection).toBeVisible();

    // Check that Reference and Brand rows exist
    await expect(invoiceSection.locator('text=রেফারেন্স')).toBeVisible();
    await expect(invoiceSection.locator('text=ব্র্যান্ড')).toBeVisible();
    await expect(invoiceSection).toContainText('PRAN');
  });

  // --------------------------------------------------------------------------
  // Change 4: Mobile Purchase Page Layout
  // --------------------------------------------------------------------------
  const mobileWidths = [360, 375, 390, 430];
  for (const width of mobileWidths) {
    test(`Change 4: Mobile Purchase Page vertical order at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto('/');
      await page.locator('.md-nav-button', { hasText: 'কেনাকাটা' }).click();

      // Elements to verify in order:
      // 1. Choose products heading (.ops-purchase-products h3)
      // 2. Search input (.ops-search)
      // 3. Purchase cart (.ops-purchase-cart)
      // 4. Supplier directory (.ops-purchase-suppliers)
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

      const boxProducts = await productsHeader.boundingBox();
      const boxSearch = await searchBox.boundingBox();
      const boxCart = await cartSection.boundingBox();
      const boxSuppliers = await supplierSection.boundingBox();

      expect(boxProducts).not.toBeNull();
      expect(boxSearch).not.toBeNull();
      expect(boxCart).not.toBeNull();
      expect(boxSuppliers).not.toBeNull();

      // Verify exact vertical order: Products heading -> Search -> Cart -> Suppliers
      expect(boxProducts!.y).toBeLessThan(boxSearch!.y);
      expect(boxSearch!.y).toBeLessThan(boxCart!.y);
      expect(boxCart!.y).toBeLessThan(boxSuppliers!.y);
    });
  }

  test('Change 4: Desktop Purchase layout preserves 2-column design (cart on right)', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/');
    await page.locator('.md-nav-button', { hasText: 'কেনাকাটা' }).click();

    const productsSection = page.locator('.ops-purchase-products');
    const cartSection = page.locator('.ops-purchase-cart');

    await expect(productsSection).toBeVisible();
    await expect(cartSection).toBeVisible();

    const boxProducts = await productsSection.boundingBox();
    const boxCart = await cartSection.boundingBox();

    expect(boxProducts).not.toBeNull();
    expect(boxCart).not.toBeNull();

    // On desktop, cart is to the right of products section
    expect(boxCart!.x).toBeGreaterThan(boxProducts!.x);
  });

  // --------------------------------------------------------------------------
  // Change 5: Mobile Home Navigation without Horizontal Scroll
  // --------------------------------------------------------------------------
  for (const width of mobileWidths) {
    test(`Change 5: Mobile navigation wrap without horizontal scroll at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto('/');

      const nav = page.locator('.md-layout .md-nav');
      await expect(nav).toBeVisible();

      // 1. Verify zero horizontal overflow / scrollbar
      const overflow = await nav.evaluate((el) => ({
        scrollWidth: el.scrollWidth,
        clientWidth: el.clientWidth,
      }));
      expect(overflow.scrollWidth).toBeLessThanOrEqual(
        overflow.clientWidth + 1,
      );

      // 2. Row 1 contains exactly: হোম, দোকানের তালিকা, বিক্রি
      const btnHome = nav.locator('.md-nav-button').nth(0);
      const btnShops = nav.locator('.md-nav-button').nth(1);
      const btnSales = nav.locator('.md-nav-button').nth(2);
      const btnPurchases = nav.locator('.md-nav-button').nth(3);

      await expect(btnHome).toContainText('হোম');
      await expect(btnShops).toContainText('দোকানের তালিকা');
      await expect(btnSales).toContainText('বিক্রি');
      await expect(btnPurchases).toContainText('কেনাকাটা');

      const boxHome = await btnHome.boundingBox();
      const boxShops = await btnShops.boundingBox();
      const boxSales = await btnSales.boundingBox();
      const boxPurchases = await btnPurchases.boundingBox();

      expect(boxHome).not.toBeNull();
      expect(boxShops).not.toBeNull();
      expect(boxSales).not.toBeNull();
      expect(boxPurchases).not.toBeNull();

      // Dynamic row packing: at widths < 400px, 3 items fit on Row 1 and 'কেনাকাটা' wraps to Row 2.
      // At wider viewports (e.g. 430px), 4 items naturally fit in Row 1.
      if (width < 400) {
        expect(boxPurchases!.y).toBeGreaterThan(boxHome!.y + 10);
      } else {
        expect(Math.abs(boxPurchases!.y - boxHome!.y)).toBeLessThan(5);
      }

      // 3. Selected navigation item gets visibly stronger soft green highlight (#c8e8d5, #0d4231)
      const activeBtn = nav.locator(".md-nav-button[aria-current='page']");
      await expect(activeBtn).toBeVisible();

      const colors = await activeBtn.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return {
          background: style.backgroundColor,
          color: style.color,
          fontWeight: style.fontWeight,
        };
      });

      // Background: rgb(200, 232, 213) which corresponds to #c8e8d5
      expect(colors.background).toBe('rgb(200, 232, 213)');
      // Text: rgb(13, 66, 49) which corresponds to #0d4231
      expect(colors.color).toBe('rgb(13, 66, 49)');
    });
  }

  test('Change 5: Desktop navigation sidebar design preserved', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/');

    const activeBtn = page.locator(
      ".md-layout .md-nav .md-nav-button[aria-current='page']",
    );
    await expect(activeBtn).toBeVisible();

    const colors = await activeBtn.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return {
        background: style.backgroundColor,
        color: style.color,
      };
    });

    // On desktop, background is var(--mint) which is rgb(232, 243, 236)
    expect(colors.background).toBe('rgb(232, 243, 236)');
  });
});
