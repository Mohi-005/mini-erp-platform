import type { Page } from '@playwright/test';

export interface SetupOptions {
  role?: 'OWNER' | 'STAFF';
  permissions?: string[];
  locale?: 'bn' | 'en';
}

export const MOCK_BUSINESS = {
  id: 'biz-001',
  name: 'হিসাব এন্টারপ্রাইজ (ধানমন্ডি)',
  business_code: 'SHOP-001',
  address: 'রোড ৪/এ, ধানমন্ডি, ঢাকা',
  phone: '01711223344',
  created_at: '2026-10-20T00:00:00Z',
  updated_at: '2026-10-20T00:00:00Z',
  created_by: 'u-owner-001',
};

export const MOCK_CATEGORIES = [
  {
    id: 'cat-01',
    business_id: 'biz-001',
    name: 'চাল',
    name_bn: 'চাল',
    description: 'সকল প্রকার চাল',
    created_at: '2026-10-20T00:00:00Z',
    updated_at: '2026-10-20T00:00:00Z',
    archived_at: null,
  },
  {
    id: 'cat-02',
    business_id: 'biz-001',
    name: 'ভোজ্যতেল',
    name_bn: 'ভোজ্য তেল ও চর্বি',
    description: 'সয়াবিন ও সরিষার তেল',
    created_at: '2026-10-20T00:00:00Z',
    updated_at: '2026-10-20T00:00:00Z',
    archived_at: null,
  },
  {
    id: 'cat-03',
    business_id: 'biz-001',
    name: 'ডাল ও মসলা',
    name_bn: 'ডাল ও মসলা',
    description: 'ডাল ও গুঁড়া মসলা',
    created_at: '2026-10-20T00:00:00Z',
    updated_at: '2026-10-20T00:00:00Z',
    archived_at: null,
  },
];

export const MOCK_UNITS = [
  {
    id: 'unit-01',
    business_id: 'biz-001',
    name: 'কেজি',
    name_bn: 'কেজি',
    base_unit: 'kg',
    conversion_factor: 1,
    created_at: '2026-10-20T00:00:00Z',
    updated_at: '2026-10-20T00:00:00Z',
    archived_at: null,
  },
  {
    id: 'unit-02',
    business_id: 'biz-001',
    name: 'লিটার',
    name_bn: 'লিটার',
    base_unit: 'L',
    conversion_factor: 1,
    created_at: '2026-10-20T00:00:00Z',
    updated_at: '2026-10-20T00:00:00Z',
    archived_at: null,
  },
  {
    id: 'unit-03',
    business_id: 'biz-001',
    name: 'বস্তা ৫০ কেজি',
    name_bn: 'বস্তা ৫০ কেজি',
    base_unit: 'kg',
    conversion_factor: 50,
    created_at: '2026-10-20T00:00:00Z',
    updated_at: '2026-10-20T00:00:00Z',
    archived_at: null,
  },
];

export const MOCK_PRODUCTS = [
  {
    id: 'prod-01',
    business_id: 'biz-001',
    sku: 'CATV2-001',
    name_bn: 'মিনিকেট চাল',
    name_en: 'Miniket Rice',
    name_banglish: 'Miniket Chal',
    category_id: 'cat-01',
    unit_id: 'unit-01',
    default_selling_price: '70',
    minimum_stock: '10',
    is_service: false,
    created_at: '2026-10-20T00:00:00Z',
    updated_at: '2026-10-20T00:00:00Z',
    archived_at: null,
  },
  {
    id: 'prod-02',
    business_id: 'biz-001',
    sku: 'CATV2-002',
    name_bn: 'নাজিরশাইল চাল',
    name_en: 'Najirshail Rice',
    name_banglish: 'Najirshail Chal',
    category_id: 'cat-01',
    unit_id: 'unit-01',
    default_selling_price: '80',
    minimum_stock: '10',
    is_service: false,
    created_at: '2026-10-20T00:00:00Z',
    updated_at: '2026-10-20T00:00:00Z',
    archived_at: null,
  },
  {
    id: 'prod-03',
    business_id: 'biz-001',
    sku: 'CATV2-039',
    name_bn: 'খোলা সয়াবিন তেল',
    name_en: 'Loose Soybean Oil',
    name_banglish: 'Khola Soybean Tel',
    category_id: 'cat-02',
    unit_id: 'unit-02',
    default_selling_price: '165',
    minimum_stock: '15',
    is_service: false,
    created_at: '2026-10-20T00:00:00Z',
    updated_at: '2026-10-20T00:00:00Z',
    archived_at: null,
  },
  {
    id: 'prod-04',
    business_id: 'biz-001',
    sku: 'CATV2-040',
    name_bn: 'বোতল সয়াবিন তেল ১ লিটার',
    name_en: 'Bottled Soybean Oil 1L',
    name_banglish: 'Bottle Soybean Tel 1L',
    category_id: 'cat-02',
    unit_id: 'unit-02',
    default_selling_price: '185',
    minimum_stock: '10',
    is_service: false,
    created_at: '2026-10-20T00:00:00Z',
    updated_at: '2026-10-20T00:00:00Z',
    archived_at: null,
  },
];

export const MOCK_CUSTOMERS = [
  {
    id: 'cust-01',
    business_id: 'biz-001',
    customer_type: 'SHOP' as const,
    name: 'রহিম স্টোর',
    owner_name: 'কাজী নজরুল',
    shop_code: 'SH-001',
    shop_number: '১২',
    phone: '01712345678',
    address: 'বাজার গলি, ধানমন্ডি',
    created_at: '2026-10-20T00:00:00Z',
    updated_at: '2026-10-20T00:00:00Z',
    archived_at: null,
  },
  {
    id: 'cust-02',
    business_id: 'biz-001',
    customer_type: 'SHOP' as const,
    name: 'করিম ট্রেডার্স',
    owner_name: 'আব্দুল করিম',
    shop_code: 'SH-002',
    shop_number: '১৫',
    phone: '01712345678', // Same phone as cust-01 to test separation!
    address: 'পূর্ব গলি, ধানমন্ডি',
    created_at: '2026-10-20T00:00:00Z',
    updated_at: '2026-10-20T00:00:00Z',
    archived_at: null,
  },
  {
    id: 'cust-03',
    business_id: 'biz-001',
    customer_type: 'SHOP' as const,
    name: 'মেসার্স সততা ভাণ্ডার',
    owner_name: 'মো. রফিকুল ইসলাম',
    shop_code: 'SH-003',
    shop_number: '২২',
    phone: '01899887766',
    address: 'চকবাজার, ঢাকা',
    created_at: '2026-10-20T00:00:00Z',
    updated_at: '2026-10-20T00:00:00Z',
    archived_at: null,
  },
];

export const MOCK_SUPPLIERS = [
  {
    id: 'supp-01',
    business_id: 'biz-001',
    name: 'স্কয়ার কনজিউমার গুডস',
    contact_person: 'আশরাফুল ইসলাম',
    phone: '01911223344',
    address: 'উত্তরা, ঢাকা',
    created_at: '2026-10-20T00:00:00Z',
    updated_at: '2026-10-20T00:00:00Z',
    archived_at: null,
  },
  {
    id: 'supp-02',
    business_id: 'biz-001',
    name: 'মেঘনা গ্রুপ অব ইন্ডাস্ট্রিজ',
    contact_person: 'মোস্তফা কামাল',
    phone: '01677889900',
    address: 'মতিঝিল, ঢাকা',
    created_at: '2026-10-20T00:00:00Z',
    updated_at: '2026-10-20T00:00:00Z',
    archived_at: null,
  },
];

export const MOCK_BALANCES = [
  {
    business_id: 'biz-001',
    product_id: 'prod-01',
    quantity: 200,
    first_movement_at: '2026-11-08T00:00:00Z',
    updated_at: '2026-11-08T00:00:00Z',
  },
  {
    business_id: 'biz-001',
    product_id: 'prod-02',
    quantity: 0,
    first_movement_at: '2026-11-08T00:00:00Z',
    updated_at: '2026-11-08T00:00:00Z',
  }, // ZERO STOCK
  {
    business_id: 'biz-001',
    product_id: 'prod-03',
    quantity: 75,
    first_movement_at: '2026-11-08T00:00:00Z',
    updated_at: '2026-11-08T00:00:00Z',
  },
  {
    business_id: 'biz-001',
    product_id: 'prod-04',
    quantity: 50,
    first_movement_at: '2026-11-08T00:00:00Z',
    updated_at: '2026-11-08T00:00:00Z',
  },
];

export const MOCK_MOVEMENTS = [
  {
    id: 'mov-01',
    business_id: 'biz-001',
    product_id: 'prod-01',
    movement_type: 'purchase',
    quantity: 200,
    unit_id: 'unit-01',
    occurred_at: '2026-11-08T09:00:00Z',
    created_at: '2026-11-08T09:00:00Z',
  },
  {
    id: 'mov-02',
    business_id: 'biz-001',
    product_id: 'prod-03',
    movement_type: 'purchase',
    quantity: 75,
    unit_id: 'unit-02',
    occurred_at: '2026-11-08T09:00:00Z',
    created_at: '2026-11-08T09:00:00Z',
  },
  {
    id: 'mov-03',
    business_id: 'biz-001',
    product_id: 'prod-04',
    movement_type: 'purchase',
    quantity: 50,
    unit_id: 'unit-02',
    occurred_at: '2026-11-08T09:00:00Z',
    created_at: '2026-11-08T09:00:00Z',
  },
  {
    id: 'mov-04',
    business_id: 'biz-001',
    product_id: 'prod-02',
    movement_type: 'purchase',
    quantity: 50,
    unit_id: 'unit-01',
    occurred_at: '2026-11-07T09:00:00Z',
    created_at: '2026-11-07T09:00:00Z',
  },
];

export const MOCK_COST_STATES = [
  {
    id: 'cost-01',
    business_id: 'biz-001',
    product_id: 'prod-01',
    unit_id: 'unit-01',
    average_unit_cost: 65,
    priced_quantity: 200,
    unpriced_quantity: 0,
    updated_at: '2026-11-08T00:00:00Z',
  },
  {
    id: 'cost-02',
    business_id: 'biz-001',
    product_id: 'prod-02',
    unit_id: 'unit-01',
    average_unit_cost: 72,
    priced_quantity: 0,
    unpriced_quantity: 0,
    updated_at: '2026-11-08T00:00:00Z',
  },
  {
    id: 'cost-03',
    business_id: 'biz-001',
    product_id: 'prod-03',
    unit_id: 'unit-02',
    average_unit_cost: 160,
    priced_quantity: 75,
    unpriced_quantity: 0,
    updated_at: '2026-11-08T00:00:00Z',
  },
  {
    id: 'cost-04',
    business_id: 'biz-001',
    product_id: 'prod-04',
    unit_id: 'unit-02',
    average_unit_cost: 175,
    priced_quantity: 50,
    unpriced_quantity: 0,
    updated_at: '2026-11-08T00:00:00Z',
  },
];

export const MOCK_SALES = [
  {
    id: 'sale-001',
    business_id: 'biz-001',
    invoice_no: 'S-20261108-001',
    customer_id: 'cust-01',
    customer_name_snapshot: 'রহিম স্টোর',
    customer_phone_snapshot: '01712345678',
    total_amount: 6500,
    paid_amount_at_sale: 4000,
    payment_method: 'CASH',
    occurred_at: '2026-11-08T10:00:00+06:00',
    created_at: '2026-11-08T10:00:00+06:00',
  },
  {
    id: 'sale-002',
    business_id: 'biz-001',
    invoice_no: 'S-20261108-002',
    customer_id: null,
    customer_name_snapshot: 'খুচরা ক্রেতা',
    customer_phone_snapshot: '01712345678', // Same phone as Rahim Store, but Walk-in!
    total_amount: 1500,
    paid_amount_at_sale: 1500,
    payment_method: 'BKASH',
    occurred_at: '2026-11-08T11:00:00+06:00',
    created_at: '2026-11-08T11:00:00+06:00',
  },
  {
    id: 'sale-003',
    business_id: 'biz-001',
    invoice_no: 'S-20261108-003',
    customer_id: null,
    customer_name_snapshot: 'খুচরা ক্রেতা',
    customer_phone_snapshot: null, // Walk-in without phone
    total_amount: 450,
    paid_amount_at_sale: 450,
    payment_method: 'CASH',
    occurred_at: '2026-11-08T12:00:00+06:00',
    created_at: '2026-11-08T12:00:00+06:00',
  },
];

export const MOCK_SALES_LINES = [
  {
    id: 'sl-001',
    business_id: 'biz-001',
    sales_document_id: 'sale-001',
    line_no: 1,
    product_id: 'prod-01',
    product_name_bn_snapshot: 'মিনিকেট চাল',
    product_name_en_snapshot: 'Miniket Rice',
    sku_snapshot: 'CATV2-001',
    unit_name_bn_snapshot: 'কেজি',
    quantity: 100,
    unit_price: 65,
    line_total: 6500,
    unit_cost_at_sale: 60,
    cogs_amount: 6000,
    costing_status: 'KNOWN' as const,
  },
  {
    id: 'sl-002',
    business_id: 'biz-001',
    sales_document_id: 'sale-002',
    line_no: 1,
    product_id: 'prod-03',
    product_name_bn_snapshot: 'খোলা সয়াবিন তেল',
    product_name_en_snapshot: 'Loose Soybean Oil',
    sku_snapshot: 'CATV2-039',
    unit_name_bn_snapshot: 'লিটার',
    quantity: 10,
    unit_price: 150,
    line_total: 1500,
    unit_cost_at_sale: 140,
    cogs_amount: 1400,
    costing_status: 'KNOWN' as const,
  },
  {
    id: 'sl-003',
    business_id: 'biz-001',
    sales_document_id: 'sale-003',
    line_no: 1,
    product_id: 'prod-04',
    product_name_bn_snapshot: 'বোতল সয়াবিন তেল ১ লিটার',
    product_name_en_snapshot: 'Bottled Soybean Oil 1L',
    sku_snapshot: 'CATV2-040',
    unit_name_bn_snapshot: 'লিটার',
    quantity: 2,
    unit_price: 225,
    line_total: 450,
    unit_cost_at_sale: 175,
    cogs_amount: 350,
    costing_status: 'KNOWN' as const,
  },
];

export const MOCK_PURCHASES = [
  {
    id: 'pur-001',
    business_id: 'biz-001',
    invoice_no: 'P-20261108-001',
    supplier_id: 'supp-01',
    supplier_name_snapshot: 'স্কয়ার কনজিউমার গুডস',
    reference_no: 'CH-88219',
    brand_note: 'PRAN',
    subtotal_amount: 12000,
    other_cost_total: 500,
    total_amount: 12500,
    paid_amount_at_purchase: 8000,
    payment_method: 'BANK',
    occurred_at: '2026-11-08T09:00:00+06:00',
    created_at: '2026-11-08T09:00:00+06:00',
  },
];

export const MOCK_PURCHASE_LINES = [
  {
    id: 'pl-001',
    business_id: 'biz-001',
    purchases_document_id: 'pur-001',
    line_no: 1,
    product_id: 'prod-01',
    product_name_bn_snapshot: 'মিনিকেট চাল',
    product_name_en_snapshot: 'Miniket Rice',
    sku_snapshot: 'CATV2-001',
    unit_name_bn_snapshot: 'কেজি',
    quantity: 200,
    unit_cost: 60,
    line_total: 12500,
    allocated_other_cost: 500,
    landed_unit_cost: 62.5,
    cost_visible: true,
    created_at: '2026-11-08T09:00:00+06:00',
  },
  {
    id: 'pl-002',
    business_id: 'biz-001',
    purchases_document_id: 'pur-001',
    line_no: 2,
    product_id: 'prod-02',
    product_name_bn_snapshot: 'নাজিরশাইল চাল',
    product_name_en_snapshot: 'Najirshail Rice',
    sku_snapshot: 'CATV2-002',
    unit_name_bn_snapshot: 'কেজি',
    quantity: 50,
    unit_cost: 70,
    line_total: 3500,
    allocated_other_cost: 0,
    landed_unit_cost: 70,
    cost_visible: true,
    created_at: '2026-11-07T09:00:00+06:00',
  },
];

export const MOCK_EXPENSES = [
  {
    id: 'exp-001',
    business_id: 'biz-001',
    category: 'RENT',
    amount: 15000,
    expense_date: '2026-11-01',
    payment_method: 'BANK',
    reference_no: 'CQ-99120',
    note: 'দোকান ভাড়া নভেম্বর ২০২৬',
    status: 'ACTIVE',
    created_at: '2026-11-01T10:00:00+06:00',
  },
  {
    id: 'exp-002',
    business_id: 'biz-001',
    category: 'OTHER',
    amount: 1200,
    expense_date: '2026-11-08',
    payment_method: 'CASH',
    reference_no: null,
    note: 'সাইনবোর্ড মেরামত ও বৈদ্যুতিক কাজ',
    status: 'ACTIVE',
    created_at: '2026-11-08T14:00:00+06:00',
  },
];

export const MOCK_PURCHASE_REFS = [
  {
    id: 'pr-01',
    business_id: 'biz-001',
    product_id: 'prod-01',
    unit_id: 'unit-01',
    last_purchase_unit_cost: 62.5,
    updated_at: '2026-11-08T09:00:00Z',
  },
  {
    id: 'pr-02',
    business_id: 'biz-001',
    product_id: 'prod-02',
    unit_id: 'unit-01',
    last_purchase_unit_cost: 70,
    updated_at: '2026-11-08T09:00:00Z',
  },
  {
    id: 'pr-03',
    business_id: 'biz-001',
    product_id: 'prod-03',
    unit_id: 'unit-02',
    last_purchase_unit_cost: 155,
    updated_at: '2026-11-08T09:00:00Z',
  },
  {
    id: 'pr-04',
    business_id: 'biz-001',
    product_id: 'prod-04',
    unit_id: 'unit-02',
    last_purchase_unit_cost: 170,
    updated_at: '2026-11-08T09:00:00Z',
  },
];

export const MOCK_AUDIT_LOG = [
  {
    id: 'aud-001',
    business_id: 'biz-001',
    action: 'SALE_POSTED',
    metadata: {
      invoice_no: 'S-20261108-002',
      total_amount: 1500,
      payment_method: 'BKASH',
      // Note: customer_phone is strictly EXCLUDED per Phase 2 Privacy correction!
    },
    created_at: '2026-11-08T11:00:05+06:00',
    created_by: 'u-owner-001',
  },
];

export function makeMockJwt(
  userId = 'u-owner-001',
  email = 'owner@example.com',
): string {
  const header = Buffer.from(
    JSON.stringify({ alg: 'HS256', typ: 'JWT' }),
  ).toString('base64url');
  const payload = Buffer.from(
    JSON.stringify({
      sub: userId,
      email,
      exp: Math.floor(Date.now() / 1000) + 86400,
      role: 'authenticated',
      aud: 'authenticated',
      app_metadata: { provider: 'email' },
      user_metadata: {},
    }),
  ).toString('base64url');
  const signature = Buffer.from('1234567890123456').toString('base64url');
  return `${header}.${payload}.${signature}`;
}

export async function setupAuthenticatedApp(
  page: Page,
  options: SetupOptions = {},
) {
  const role = options.role ?? 'OWNER';
  const permissions = options.permissions ?? [];
  const locale = options.locale ?? 'bn';
  const mockJwt = makeMockJwt('u-owner-001', 'owner@example.com');

  // Intercept Auth Session
  await page.route('**/auth/v1/user', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'u-owner-001',
        aud: 'authenticated',
        role: 'authenticated',
        email: 'owner@example.com',
        phone: '',
        app_metadata: { provider: 'email' },
        user_metadata: {},
        created_at: '2026-10-20T00:00:00Z',
      }),
    });
  });

  await page.route('**/auth/v1/session', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        access_token: mockJwt,
        token_type: 'bearer',
        expires_in: 86400,
        expires_at: Math.floor(Date.now() / 1000) + 86400,
        refresh_token: 'mock-refresh-token',
        user: {
          id: 'u-owner-001',
          aud: 'authenticated',
          role: 'authenticated',
          email: 'owner@example.com',
        },
      }),
    });
  });

  await page.route('**/auth/v1/token*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        access_token: mockJwt,
        token_type: 'bearer',
        expires_in: 86400,
        expires_at: Math.floor(Date.now() / 1000) + 86400,
        refresh_token: 'mock-refresh-token',
        user: {
          id: 'u-owner-001',
          aud: 'authenticated',
          role: 'authenticated',
          email: 'owner@example.com',
        },
      }),
    });
  });

  // Intercept REST Tables
  await page.route('**/rest/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const pathname = url.pathname;

    if (pathname.includes('/rpc/post_sale')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify('s-new-mock-sale-id'),
      });
      return;
    }

    if (pathname.includes('/rpc/post_purchase')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify('p-new-mock-purchase-id'),
      });
      return;
    }

    if (pathname.includes('/rpc/record_expense')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify('exp-new-mock-id'),
      });
      return;
    }

    // Profiles
    if (pathname.endsWith('/profiles')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'u-owner-001',
            display_name: 'কাজী মিজানুর রহমান',
            phone: '01711000000',
            preferred_language: locale,
            default_business_id: 'biz-001',
            created_at: '2026-10-20T00:00:00Z',
          },
        ]),
      });
      return;
    }

    // Business Members
    if (pathname.endsWith('/business_members')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'bm-001',
            business_id: 'biz-001',
            user_id: 'u-owner-001',
            role,
            status: 'ACTIVE',
            created_at: '2026-10-20T00:00:00Z',
          },
        ]),
      });
      return;
    }

    // Businesses
    if (pathname.endsWith('/businesses')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([MOCK_BUSINESS]),
      });
      return;
    }

    // Business Settings
    if (pathname.endsWith('/business_settings')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            business_id: 'biz-001',
            currency: 'BDT',
            default_language: locale,
            created_at: '2026-10-20T00:00:00Z',
          },
        ]),
      });
      return;
    }

    // Permissions
    if (pathname.endsWith('/business_member_permissions')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(
          permissions.map((p, idx) => ({
            id: `bmp-${idx}`,
            member_id: 'bm-001',
            permission: p,
          })),
        ),
      });
      return;
    }

    const headers = request.headers();
    const wantsSingle = Boolean(
      headers.accept?.includes('application/vnd.pgrst.object+json'),
    );

    // Master Data & Operations Tables
    if (pathname.endsWith('/product_categories')) {
      if (request.method() === 'POST') {
        const payload = request.postDataJSON() || {};
        const newCat = {
          id: 'cat-new-' + Math.random().toString(36).substring(2, 9),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          archived_at: null,
          ...payload,
        };
        await route.fulfill({
          status: 201,
          contentType: wantsSingle
            ? 'application/vnd.pgrst.object+json'
            : 'application/json',
          body: JSON.stringify(wantsSingle ? newCat : [newCat]),
        });
        return;
      }
      const rawNameBn = url.searchParams.get('name_bn');
      if (rawNameBn || wantsSingle) {
        const nameBn = rawNameBn
          ? decodeURIComponent(rawNameBn)
              .replace(/^eq\./, '')
              .replace(/^"|"$/g, '')
          : null;
        const matched = MOCK_CATEGORIES.filter(
          (c) => !nameBn || c.name === nameBn || c.name_bn === nameBn,
        );
        await route.fulfill({
          status: 200,
          contentType: wantsSingle
            ? 'application/vnd.pgrst.object+json'
            : 'application/json',
          body: JSON.stringify(wantsSingle ? (matched[0] ?? null) : matched),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_CATEGORIES),
      });
      return;
    }

    if (pathname.endsWith('/product_units')) {
      if (request.method() === 'POST') {
        const payload = request.postDataJSON() || {};
        const newUnit = {
          id: 'unit-new-' + Math.random().toString(36).substring(2, 9),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          archived_at: null,
          ...payload,
        };
        await route.fulfill({
          status: 201,
          contentType: wantsSingle
            ? 'application/vnd.pgrst.object+json'
            : 'application/json',
          body: JSON.stringify(wantsSingle ? newUnit : [newUnit]),
        });
        return;
      }
      const rawNameBn = url.searchParams.get('name_bn');
      if (rawNameBn || wantsSingle) {
        const nameBn = rawNameBn
          ? decodeURIComponent(rawNameBn)
              .replace(/^eq\./, '')
              .replace(/^"|"$/g, '')
          : null;
        const matched = MOCK_UNITS.filter(
          (u) => !nameBn || u.name === nameBn || u.name_bn === nameBn,
        );
        await route.fulfill({
          status: 200,
          contentType: wantsSingle
            ? 'application/vnd.pgrst.object+json'
            : 'application/json',
          body: JSON.stringify(wantsSingle ? (matched[0] ?? null) : matched),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_UNITS),
      });
      return;
    }

    if (pathname.endsWith('/products')) {
      if (request.method() === 'POST') {
        const payload = request.postDataJSON() || {};
        const newProduct = {
          id: 'prod-new-' + Math.random().toString(36).substring(2, 9),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          archived_at: null,
          ...payload,
        };
        await route.fulfill({
          status: 201,
          contentType: wantsSingle
            ? 'application/vnd.pgrst.object+json'
            : 'application/json',
          body: JSON.stringify(wantsSingle ? newProduct : [newProduct]),
        });
        return;
      }
      if (request.method() === 'PATCH') {
        const payload = request.postDataJSON() || {};
        await route.fulfill({
          status: 200,
          contentType: wantsSingle
            ? 'application/vnd.pgrst.object+json'
            : 'application/json',
          body: JSON.stringify(wantsSingle ? payload : [payload]),
        });
        return;
      }
      const rawSku = url.searchParams.get('sku');
      const rawNameBn = url.searchParams.get('name_bn');
      if (rawSku || rawNameBn || wantsSingle) {
        const sku = rawSku
          ? decodeURIComponent(rawSku)
              .replace(/^eq\./, '')
              .replace(/^"|"$/g, '')
          : null;
        const nameBn = rawNameBn
          ? decodeURIComponent(rawNameBn)
              .replace(/^eq\./, '')
              .replace(/^"|"$/g, '')
          : null;
        const matched = MOCK_PRODUCTS.filter(
          (p) => (sku && p.sku === sku) || (nameBn && p.name_bn === nameBn),
        );
        await route.fulfill({
          status: 200,
          contentType: wantsSingle
            ? 'application/vnd.pgrst.object+json'
            : 'application/json',
          body: JSON.stringify(wantsSingle ? (matched[0] ?? null) : matched),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_PRODUCTS),
      });
      return;
    }

    if (pathname.endsWith('/customers')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_CUSTOMERS),
      });
      return;
    }

    if (pathname.endsWith('/suppliers')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_SUPPLIERS),
      });
      return;
    }

    if (pathname.endsWith('/inventory_balances')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_BALANCES),
      });
      return;
    }

    if (pathname.endsWith('/inventory_cost_state')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_COST_STATES),
      });
      return;
    }

    if (pathname.endsWith('/inventory_movements')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_MOVEMENTS),
      });
      return;
    }

    if (pathname.endsWith('/sales_documents')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_SALES),
      });
      return;
    }

    if (pathname.endsWith('/sales_lines_read')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_SALES_LINES),
      });
      return;
    }

    if (pathname.endsWith('/purchases_documents')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_PURCHASES),
      });
      return;
    }

    if (pathname.endsWith('/purchase_lines_read')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_PURCHASE_LINES),
      });
      return;
    }

    if (pathname.endsWith('/customer_receipts')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
      return;
    }

    if (pathname.endsWith('/customer_receipt_allocations')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
      return;
    }

    if (pathname.endsWith('/supplier_payments')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
      return;
    }

    if (pathname.endsWith('/supplier_payment_allocations')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
      return;
    }

    if (pathname.endsWith('/business_expenses')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_EXPENSES),
      });
      return;
    }

    if (pathname.endsWith('/product_purchase_references')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_PURCHASE_REFS),
      });
      return;
    }

    if (pathname.endsWith('/business_audit_log')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_AUDIT_LOG),
      });
      return;
    }

    // Default fallback for any unmatched GET
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });

  // Provide localStorage session marker so supabase auth recovers session immediately
  await page.addInitScript((jwt) => {
    const fakeToken = {
      access_token: jwt,
      token_type: 'bearer',
      expires_in: 86400,
      expires_at: Math.floor(Date.now() / 1000) + 86400,
      refresh_token: 'mock-refresh-token',
      user: {
        id: 'u-owner-001',
        aud: 'authenticated',
        role: 'authenticated',
        email: 'owner@example.com',
        app_metadata: { provider: 'email' },
        user_metadata: {},
        created_at: '2026-10-20T00:00:00Z',
      },
    };
    const serialized = JSON.stringify(fakeToken);
    localStorage.setItem('sb-jujwnhwrktmimtcnljsd-auth-token', serialized);
  }, mockJwt);
}
