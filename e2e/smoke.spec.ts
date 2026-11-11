import { test, expect } from '@playwright/test';

test.describe('Mini ERP Smoke Test', () => {
  test('serves web app and loads root page', async ({ page }) => {
    await page.goto('/');
    // Check that title or page container renders
    await expect(page).toHaveTitle(/মিনি ইআরপি|Mini ERP|হিসাব/);
  });
});
