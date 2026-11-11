import { test, expect } from '@playwright/test';
import { setupAuthenticatedApp } from './helpers/mock-env';

test.describe('Purchase Workflow (PUR-01 to PUR-04)', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedApp(page);
    page.on('dialog', (dialog) => dialog.accept());
    await page.goto('/');
    // Navigate to Purchases
    await page.locator('.md-nav-button', { hasText: 'কেনাকাটা' }).click();
    await expect(page.locator('.ops-search')).toBeVisible();
  });

  test('PUR-01: Product recommendation cards with medium (76px) image', async ({
    page,
  }) => {
    await page.locator('.ops-search').fill('মিনিকেট');
    const cardImg = page.locator('.ops-product-card .product-img-md').first();
    await expect(cardImg).toBeVisible();
  });

  test('PUR-02: Add to cart & large (~128px) image in purchase cart', async ({
    page,
  }) => {
    await page.locator('.ops-search').fill('মিনিকেট');
    // Click on product card to add to cart
    await page.locator('.ops-product-card').first().click();

    // Cart line should display large image (xl, 128px)
    const cartImg = page.locator('.ops-cart-item .product-img-xl').first();
    await expect(cartImg).toBeVisible();

    const box = await cartImg.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThanOrEqual(120);
    expect(box!.height).toBeGreaterThanOrEqual(120);
  });

  test('PUR-A: Search result product card click adds to Purchase cart', async ({
    page,
  }) => {
    const searchInput = page.getByPlaceholder(
      /পণ্যের নাম\/SKU বা ক্যাটালগ খুঁজুন|Search product name/i,
    );
    await searchInput.fill('মিনিকেট');

    // Result card appears in products grid
    const resultCard = page
      .locator('.ops-products-grid .ops-product-card')
      .first();
    await expect(resultCard).toBeVisible();

    // Clicking the card body adds product to cart
    await resultCard.click();
    const cartItem = page.locator('.ops-cart-item').first();
    await expect(cartItem).toBeVisible();
    await expect(cartItem).toContainText('মিনিকেট');
  });

  test('PUR-B: Search result plus button click adds to Purchase cart', async ({
    page,
  }) => {
    const searchInput = page.getByPlaceholder(
      /পণ্যের নাম\/SKU বা ক্যাটালগ খুঁজুন|Search product name/i,
    );
    await searchInput.fill('সরিষার তেল');

    // Wait for search result card
    const card = page
      .locator('.ops-products-grid .ops-product-card', {
        hasText: 'সরিষার তেল',
      })
      .first();
    await expect(card).toBeVisible();

    // Click the plus button inside the card specifically
    const plusBtn = card.locator('.ops-add-mark');
    await plusBtn.click();

    const cartItem = page.locator('.ops-cart-item', {
      hasText: 'সরিষার তেল',
    });
    await expect(cartItem).toBeVisible();
  });

  test('PUR-C: Recommendation & Recent Search plus button click', async ({
    page,
  }) => {
    // Populate Recent Search by searching and adding a product
    const searchInput = page.getByPlaceholder(
      /পণ্যের নাম\/SKU বা ক্যাটালগ খুঁজুন|Search product name/i,
    );
    await searchInput.fill('সরিষার তেল');
    await page.locator('.ops-products-grid .ops-product-card').first().click();
    await searchInput.fill('');
    await page.getByRole('button', { name: /খালি করো|Clear/i }).click();

    // With empty search and populated recent items, Recent Search chips are visible
    const chip = page.locator('.ops-chip').first();
    await expect(chip).toBeVisible();
    const chipText = (await chip.locator('strong').textContent())?.trim() ?? '';

    // Click the plus button inside the chip specifically
    const plusBtn = chip.locator('.ops-chip-add');
    await plusBtn.click();

    const cartItem = page.locator('.ops-cart-item').first();
    await expect(cartItem).toBeVisible();
    if (chipText) {
      await expect(cartItem).toContainText(chipText);
    }
  });

  test('PUR-D: Cart state preservation when adopting new catalogue product', async ({
    page,
  }) => {
    // 1. Search and add first product from search results
    const searchInput = page.getByPlaceholder(
      /পণ্যের নাম\/SKU বা ক্যাটালগ খুঁজুন|Search product name/i,
    );
    await searchInput.fill('মিনিকেট');
    await page.locator('.ops-products-grid .ops-product-card').first().click();
    await expect(page.locator('.ops-cart-item')).toHaveCount(1);

    // 2. Search for a different product
    await searchInput.fill('হলুদ');

    // 3. Add second product from search results
    const card = page.locator('.ops-products-grid .ops-product-card').first();
    await expect(card).toBeVisible();
    await card.click();

    // 4. Cart must now preserve both items!
    await expect(page.locator('.ops-cart-item')).toHaveCount(2);
  });

  test('PUR-E: Dynamic Recent Search moves newest item to position 1', async ({
    page,
  }) => {
    const searchInput = page.getByPlaceholder(
      /পণ্যের নাম\/SKU বা ক্যাটালগ খুঁজুন|Search product name/i,
    );
    await searchInput.fill('সরিষার তেল');

    const card = page
      .locator('.ops-products-grid .ops-product-card', {
        hasText: 'সরিষার তেল',
      })
      .first();
    await expect(card).toBeVisible();
    await card.click();

    // Clear search
    await searchInput.fill('');

    // Recent items section must be visible with সরিষার তেল at index 0
    const firstRecentChip = page.locator('.ops-chip').first();
    await expect(firstRecentChip).toBeVisible();
    await expect(firstRecentChip).toContainText('সরিষার তেল');
  });

  test('PUR-03 & PUR-04: Landed cost calculation & purchase posting', async ({
    page,
  }) => {
    let capturedRpcPayload: Record<string, unknown> | null = null;
    await page.route('**/rpc/post_purchase', async (route) => {
      capturedRpcPayload = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify('p-new-purchase-doc-id'),
      });
    });

    // Add product to cart by searching
    await page.locator('.ops-search').fill('মিনিকেট');
    await page.locator('.ops-products-grid .ops-product-card').first().click();

    // Select supplier specifically
    const supplierSelect = page.getByRole('combobox', { name: /সরবরাহকারী/i });
    await supplierSelect.selectOption({ label: 'স্কয়ার কনজিউমার গুডস' });

    // Review and confirm purchase
    const confirmBtn = page.getByRole('button', {
      name: /যাচাই করে কেনাকাটা নিশ্চিত করুন|Review and confirm purchase/i,
    });
    await confirmBtn.click();

    expect(capturedRpcPayload).not.toBeNull();
    expect((capturedRpcPayload as Record<string, unknown>).p_supplier_id).toBe(
      'supp-01',
    );
  });

  test('PUR-05: 9-Item Recent Search / Quick Selection chips in Purchases', async ({
    page,
  }) => {
    // Search and select product to add to recent items
    const searchInput = page.getByPlaceholder(
      /পণ্যের নাম\/SKU বা ক্যাটালগ খুঁজুন|Search product name/i,
    );
    await searchInput.fill('মিনিকেট');
    await page.locator('.ops-products-grid .ops-product-card').first().click();
    await searchInput.fill('');

    // In Purchases, when search is empty and recent items populated, recent chips show up to 9 products
    const quickChips = page.locator('.ops-chip:has(.product-img-thumb)');
    const count = await quickChips.count();
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThanOrEqual(9);

    // Clicking a quick chip adds product directly to the purchase cart
    await page.getByRole('button', { name: /খালি করো|Clear/i }).click();
    await quickChips.first().click();
    const cartItems = page.locator('.ops-cart-item');
    await expect(cartItems.first()).toBeVisible();
  });

  test('PUR-06: Canonical product search & adoption in Purchases (including parens)', async ({
    page,
  }) => {
    page.on('console', (msg) =>
      console.log('PAGE LOG:', msg.type(), msg.text()),
    );
    page.on('pageerror', (err) => console.log('PAGE ERROR:', err.message));

    // Search for a canonical product with parentheses in name: সরিষার তেল
    const searchInput = page.getByPlaceholder(
      /পণ্যের নাম\/SKU বা ক্যাটালগ খুঁজুন|Search product name/i,
    );
    await searchInput.fill('সরিষার তেল');

    // Should render canonical catalogue chips (up to 9 items)
    const catChips = page.locator('.ops-chip:has-text("সরিষার তেল")');
    await expect(catChips.first()).toBeVisible();
    const count = await catChips.count();
    expect(count).toBeLessThanOrEqual(9);

    // Clicking it adds/adopts it into the purchase cart
    await catChips.first().click();
    const cartItems = page.locator('.ops-cart-item');
    await expect(cartItems.first()).toBeVisible();
  });
});

test.describe('Sales Workflow (SALE-01 to SALE-07)', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedApp(page);
    page.on('dialog', (dialog) => dialog.accept());
    await page.goto('/');
    // Navigate to Sales
    await page.locator('.md-nav-button', { hasText: 'বিক্রি' }).click();
  });

  test('SALE-01: Available products in stock & small (48px) card image', async ({
    page,
  }) => {
    const cardImg = page.locator('.ops-product-card .product-img-sm').first();
    await expect(cardImg).toBeVisible();
  });

  test('SALE-02: Add to cart & large (96px) cart line image', async ({
    page,
  }) => {
    await page.locator('.ops-product-card').first().click();

    const cartImg = page.locator('.ops-cart-item .product-img-lg').first();
    await expect(cartImg).toBeVisible();
  });

  test('SALE-03: Stock limit validation prevents selling excess quantity', async ({
    page,
  }) => {
    let alertText = '';
    page.removeAllListeners('dialog');
    page.on('dialog', async (dialog) => {
      alertText = dialog.message();
      await dialog.accept();
    });

    await page.locator('.ops-product-card').first().click();

    // Set excessive quantity in cart input (stock is 200kg, we ask for 500kg)
    const qtyInput = page.locator('.ops-cart-item input').first();
    await qtyInput.fill('500');

    // Pay exact full cash amount so credit/overpayment validation doesn't trigger: 500 * 70 = 35000
    const paidInput = page.getByLabel('এখন পরিশোধ');
    await paidInput.fill('35000');

    // Click confirm sale button
    const submitBtn = page.getByRole('button', {
      name: /যাচাই করে বিক্রি নিশ্চিত করুন|Review and confirm sale/i,
    });
    await submitBtn.click();

    expect(alertText).toContain('পর্যাপ্ত স্টক নেই');
  });

  test('SALE-04: Walk-in customer optional phone input display and hint', async ({
    page,
  }) => {
    const phoneInput = page.locator('input[placeholder="01XXXXXXXXX"]');
    await expect(phoneInput).toBeVisible();

    const phoneLabel = page.locator(
      'label:has-text("ক্রেতার মোবাইল নম্বর (ঐচ্ছিক)")',
    );
    await expect(phoneLabel).toBeVisible();
  });

  test('SALE-05: Walk-in sale completion without phone', async ({ page }) => {
    let capturedRpcPayload: Record<string, unknown> | null = null;
    await page.route('**/rpc/post_sale', async (route) => {
      capturedRpcPayload = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify('s-new-sale-doc-id'),
      });
    });

    // Add item to cart (1 unit Miniket Rice = 70 Tk)
    await page.locator('.ops-product-card').first().click();

    // Pay full cash amount for walk-in (70 Tk)
    const paidInput = page.getByLabel('এখন পরিশোধ');
    await paidInput.fill('70');

    // Leave phone empty and click submit
    const submitBtn = page.getByRole('button', {
      name: /যাচাই করে বিক্রি নিশ্চিত করুন|Review and confirm sale/i,
    });
    await submitBtn.click();

    expect(capturedRpcPayload).not.toBeNull();
    // p_customer_phone should NOT be present when phone is omitted
    expect(
      (capturedRpcPayload as Record<string, unknown>).p_customer_phone,
    ).toBeUndefined();
  });

  test('SALE-06: Walk-in sale completion with 11-digit mobile number', async ({
    page,
  }) => {
    let capturedRpcPayload: Record<string, unknown> | null = null;
    await page.route('**/rpc/post_sale', async (route) => {
      capturedRpcPayload = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify('s-new-sale-doc-id'),
      });
    });

    // Add item to cart (1 unit Miniket Rice = 70 Tk)
    await page.locator('.ops-product-card').first().click();

    // Fill in 11-digit mobile
    const phoneInput = page.locator('input[placeholder="01XXXXXXXXX"]');
    await phoneInput.fill('01712345678');

    // Pay full cash amount (70 Tk)
    const paidInput = page.getByLabel('এখন পরিশোধ');
    await paidInput.fill('70');

    // Submit sale
    const submitBtn = page.getByRole('button', {
      name: /যাচাই করে বিক্রি নিশ্চিত করুন|Review and confirm sale/i,
    });
    await submitBtn.click();

    expect(capturedRpcPayload).not.toBeNull();
    // Must pass p_customer_phone snapshot
    expect(
      (capturedRpcPayload as Record<string, unknown>).p_customer_phone,
    ).toBe('01712345678');
    // Must NOT have customer_id (stays null for walk-in)
    expect(
      (capturedRpcPayload as Record<string, unknown>).p_customer_id,
    ).toBeNull();
  });

  test('SALE-07: Registered customer due/credit sale with partial payment', async ({
    page,
  }) => {
    // Add item to cart
    await page.locator('.ops-product-card').first().click();

    // Select registered customer (Rahim Store)
    const customerSelect = page.locator('select:has-text("Walk-in")').first();
    await customerSelect.selectOption({ label: 'রহিম স্টোর (SH-001)' });

    // Phone input should hide when registered customer is selected
    const phoneInput = page.locator('input[placeholder="01XXXXXXXXX"]');
    await expect(phoneInput).not.toBeVisible();

    // Verify Due is calculated and visible
    await expect(
      page.locator('.ops-total:has-text("বাকি") strong'),
    ).toBeVisible();
  });
});
