import { test, expect } from '@playwright/test';
import { setupAuthenticatedApp } from './helpers/mock-env';

const MOBILE_VIEWPORTS = [
  { width: 320, height: 600, name: '320px (Ultra Compact)' },
  { width: 360, height: 740, name: '360px (Small Mobile)' },
  { width: 375, height: 667, name: '375px (iPhone SE)' },
  { width: 390, height: 844, name: '390px (iPhone 12/13/14)' },
  { width: 430, height: 932, name: '430px (iPhone Pro Max)' },
];

const DESKTOP_VIEWPORTS = [
  { width: 1280, height: 800, name: '1280px (Standard Desktop)' },
  { width: 1440, height: 900, name: '1440px (Wide Desktop)' },
];

const EXPECTED_NAV_ITEMS = [
  { id: 'home', label: 'হোম' },
  { id: 'shops', label: 'দোকানের তালিকা' },
  { id: 'sales', label: 'বিক্রি' },
  { id: 'purchases', label: 'কেনাকাটা' },
  { id: 'products', label: 'পণ্য ও স্টক' },
  { id: 'dues', label: 'ক্রেতার বাকি' },
  { id: 'expenses', label: 'খরচ' },
  { id: 'estimator', label: 'লাভের হিসাব' },
  { id: 'reports', label: 'রিপোর্ট' },
  { id: 'transactions', label: 'ইনভয়েস ও লেনদেন' },
  { id: 'settings', label: 'সেটিংস' },
];

test.describe('PHASE 9.2: Mobile Navigation Dynamic Row Optimization', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedApp(page);
    page.on('dialog', (dialog) => dialog.accept());
  });

  for (const vp of MOBILE_VIEWPORTS) {
    test(`Mobile Dynamic Row Packing & Space Utilization at ${vp.name}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');

      const nav = page.locator('.md-layout .md-nav');
      await expect(nav).toBeVisible();

      const navBox = (await nav.boundingBox())!;
      expect(navBox).not.toBeNull();

      // 1. Zero horizontal overflow on nav and viewport body
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

      // 2. All 11 existing navigation items are present in exact order
      const navButtons = nav.locator('.md-nav-button');
      await expect(navButtons).toHaveCount(11);

      for (let i = 0; i < EXPECTED_NAV_ITEMS.length; i++) {
        await expect(navButtons.nth(i)).toContainText(
          EXPECTED_NAV_ITEMS[i].label,
        );
      }

      // 3. Inspect every button: bounding box, label visibility, boundaries
      const btnData: {
        text: string;
        box: { x: number; y: number; width: number; height: number };
        index: number;
      }[] = [];
      for (let i = 0; i < 11; i++) {
        const btn = navButtons.nth(i);
        const text = (await btn.innerText()).trim();
        const box = (await btn.boundingBox())!;
        const scrollWidth = await btn.evaluate((el) => el.scrollWidth);
        const clientWidth = await btn.evaluate((el) => el.clientWidth);

        // Label must not be truncated, clipped or hidden
        expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);

        // Button must be fully inside navigation horizontal container
        expect(box.x).toBeGreaterThanOrEqual(navBox.x - 1);
        expect(box.x + box.width).toBeLessThanOrEqual(
          navBox.x + navBox.width + 1,
        );

        // Minimum tap target height
        expect(box.height).toBeGreaterThanOrEqual(38);

        btnData.push({ text, box, index: i });
      }

      // 4. Group buttons by row based on Y position (similar Y within 8px)
      const rows: (typeof btnData)[] = [];
      for (const b of btnData) {
        let placed = false;
        for (const row of rows) {
          if (Math.abs(row[0].box.y - b.box.y) < 8) {
            row.push(b);
            placed = true;
            break;
          }
        }
        if (!placed) {
          rows.push([b]);
        }
      }

      // 5. Verify dynamic row packing characteristics:
      // Row count must vary dynamically based on width (e.g. 5 rows at 320px, 4 rows at 360-390px, 3 rows at 430px)
      if (vp.width <= 320) {
        expect(rows.length).toBe(5);
      } else if (vp.width <= 390) {
        expect(rows.length).toBe(4);
      } else {
        expect(rows.length).toBe(3);
      }

      // 6. Verify row space utilization:
      // Each row must distribute available width efficiently without large empty space
      rows.forEach((r) => {
        // No overlap between adjacent buttons in same row
        for (let i = 0; i < r.length - 1; i++) {
          const current = r[i].box;
          const next = r[i + 1].box;
          expect(current.x + current.width).toBeLessThanOrEqual(next.x + 0.5);
        }

        const minX = Math.min(...r.map((item) => item.box.x));
        const maxX = Math.max(...r.map((item) => item.box.x + item.box.width));
        const span = maxX - minX;

        // Row span covers virtually the entire nav container width (<= 2px gap tolerance)
        expect(span).toBeGreaterThanOrEqual(navBox.width - 2);
      });

      // 7. Verify active highlight and highlight transfer
      // Initial active is 'হোম'
      await expect(navButtons.nth(0)).toHaveAttribute('aria-current', 'page');
      let colors = await navButtons.nth(0).evaluate((el) => {
        const s = window.getComputedStyle(el);
        return { bg: s.backgroundColor, color: s.color, fw: s.fontWeight };
      });
      expect(colors.bg).toBe('rgb(200, 232, 213)'); // #c8e8d5
      expect(colors.color).toBe('rgb(13, 66, 49)'); // #0d4231
      expect(parseInt(colors.fw, 10)).toBeGreaterThanOrEqual(700);

      // Click 'দোকানের তালিকা' -> active moves
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

      // Click 'বিক্রি' -> active moves
      await navButtons.nth(2).click();
      await expect(navButtons.nth(2)).toHaveAttribute('aria-current', 'page');
      await expect(navButtons.nth(1)).not.toHaveAttribute(
        'aria-current',
        'page',
      );
      colors = await navButtons.nth(2).evaluate((el) => {
        const s = window.getComputedStyle(el);
        return { bg: s.backgroundColor, color: s.color };
      });
      expect(colors.bg).toBe('rgb(200, 232, 213)');
      expect(colors.color).toBe('rgb(13, 66, 49)');
    });
  }

  // --------------------------------------------------------------------------
  // Desktop Navigation Preservation Verification
  // --------------------------------------------------------------------------
  for (const vp of DESKTOP_VIEWPORTS) {
    test(`Desktop Navigation Preserved at ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');

      const sidebar = page.locator('.md-layout .sidebar');
      await expect(sidebar).toBeVisible();

      // Check vertical sidebar layout at desktop (280px sidebar width)
      const sidebarBox = (await sidebar.boundingBox())!;
      expect(sidebarBox.width).toBeCloseTo(280, -1);

      const navButtons = sidebar.locator('.md-nav .md-nav-button');
      await expect(navButtons).toHaveCount(11);

      // Verify vertical stacked buttons (each button below previous)
      const box0 = (await navButtons.nth(0).boundingBox())!;
      const box1 = (await navButtons.nth(1).boundingBox())!;
      expect(box1.y).toBeGreaterThan(box0.y + 35);

      // Verify desktop active color uses var(--mint) / #e8f3ec
      const activeBtn = navButtons.first();
      await expect(activeBtn).toHaveAttribute('aria-current', 'page');
      const desktopColors = await activeBtn.evaluate((el) => {
        const s = window.getComputedStyle(el);
        return { bg: s.backgroundColor, color: s.color };
      });
      expect(desktopColors.bg).toBe('rgb(232, 243, 236)'); // #e8f3ec
    });
  }
});
