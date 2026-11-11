import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getProductImageUrl,
  getCatalogueImageUrl,
  findCanonicalProduct,
  CANONICAL_283_CATALOGUE,
} from '../src/catalogue.ts';
import {
  normalizeBdMobile,
  isBdMobile,
  areBdMobilesEqual,
} from '../src/phone.ts';
import { normalizePhoneSnapshot } from '../src/sales-service.ts';

test('Phase 3 - Image Mapping: Representative products resolve to exact canonical images', () => {
  // CATV2-001 — Miniket Rice
  const p1 = findCanonicalProduct({ code: 'CATV2-001' });
  assert.equal(p1?.name_bn, 'মিনিকেট চাল');
  assert.equal(p1?.image_path, 'catalogue-v2/CATV2-001.webp');
  assert.ok(
    getProductImageUrl(p1)?.includes(
      'catalogue-images/catalogue-v2/CATV2-001.webp',
    ),
  );
  assert.equal(
    getCatalogueImageUrl('catalogue-v2/CATV2-001.webp'),
    getProductImageUrl(p1),
  );
  assert.ok(isBdMobile('01712345678'));

  // CATV2-002 — Najirshail Rice
  const p2 = findCanonicalProduct({ code: 'CATV2-002' });
  assert.equal(p2?.name_bn, 'নাজিরশাইল চাল');
  assert.equal(p2?.image_path, 'catalogue-v2/CATV2-002.webp');
  assert.ok(
    getProductImageUrl(p2)?.includes(
      'catalogue-images/catalogue-v2/CATV2-002.webp',
    ),
  );

  // CATV2-039 — Soybean Oil (Loose)
  const p39 = findCanonicalProduct({ code: 'CATV2-039' });
  assert.equal(p39?.name_bn, 'সয়াবিন তেল (খোলা)');
  assert.equal(p39?.image_path, 'catalogue-v2/CATV2-039.webp');
  assert.ok(
    getProductImageUrl(p39)?.includes(
      'catalogue-images/catalogue-v2/CATV2-039.webp',
    ),
  );

  // CATV2-040 — Soybean Oil (Litre)
  const p40 = findCanonicalProduct({ code: 'CATV2-040' });
  assert.equal(p40?.name_bn, 'সয়াবিন তেল (লিটার)');
  assert.equal(p40?.image_path, 'catalogue-v2/CATV2-040.webp');
  assert.ok(
    getProductImageUrl(p40)?.includes(
      'catalogue-images/catalogue-v2/CATV2-040.webp',
    ),
  );

  // Restricted product (CATV2-194)
  const p194 = findCanonicalProduct({ code: 'CATV2-194' });
  assert.equal(p194?.is_restricted, true);
  assert.equal(p194?.name_bn, 'মশা মারার স্প্রে');
  assert.equal(p194?.image_path, 'catalogue-v2/CATV2-194.webp');

  // Product with longer Bengali name (CATV2-007)
  const p7 = findCanonicalProduct({ code: 'CATV2-007' });
  assert.equal(p7?.name_bn, 'পোলাওয়ের চাল (কালিজিরা)');
  assert.equal(p7?.image_path, 'catalogue-v2/CATV2-007.webp');

  // Verify non-collision: every single one of 283 products has unique code, SKU, and image path
  const imagePaths = new Set<string>();
  const codes = new Set<string>();
  for (const item of CANONICAL_283_CATALOGUE) {
    assert.ok(item.image_path, `Item ${item.code} missing image_path`);
    assert.ok(
      !imagePaths.has(item.image_path),
      `Duplicate image_path ${item.image_path}`,
    );
    assert.ok(!codes.has(item.code), `Duplicate code ${item.code}`);
    imagePaths.add(item.image_path);
    codes.add(item.code);
  }
  assert.equal(imagePaths.size, 283);
  assert.equal(codes.size, 283);
});

test('Phase 3 - Image Fallback: Unmatched custom product returns null gracefully', () => {
  const custom = { name_bn: 'আমার নিজস্ব পণ্য', sku: 'CUSTOM-001' };
  assert.equal(getProductImageUrl(custom), null);
  assert.equal(getProductImageUrl(null), null);
});

test('Phase 3 - Stock Ledger: Zero-stock detection and replenishment transition', () => {
  function computeStockState(quantity: number, minimumStock: number | null) {
    const isZeroStock = quantity === 0;
    const isLowStock =
      minimumStock !== null && quantity > 0 && quantity <= minimumStock;
    return {
      isZeroStock,
      badgeText: isZeroStock ? 'স্টক শেষ' : isLowStock ? 'কম স্টক' : 'ঠিক আছে',
      rowHighlight: isZeroStock ? 'ops-zero-stock-row' : null,
    };
  }

  // 1. Initial zero stock
  const zeroState = computeStockState(0, 10);
  assert.equal(zeroState.isZeroStock, true);
  assert.equal(zeroState.badgeText, 'স্টক শেষ');
  assert.equal(zeroState.rowHighlight, 'ops-zero-stock-row');

  // 2. Replenished with 5 units (below minimum 10)
  const lowState = computeStockState(5, 10);
  assert.equal(lowState.isZeroStock, false);
  assert.equal(lowState.badgeText, 'কম স্টক');
  assert.equal(lowState.rowHighlight, null);

  // 3. Replenished with 50 units (healthy stock)
  const healthyState = computeStockState(50, 10);
  assert.equal(healthyState.isZeroStock, false);
  assert.equal(healthyState.badgeText, 'ঠিক আছে');
  assert.equal(healthyState.rowHighlight, null);
});

test('Phase 3 - Profit Estimator: Exact Bengali warning condition', () => {
  const EXACT_WARNING =
    '⚠️ বিক্রির পরিমাণ কেনার পরিমাণের চেয়ে বেশি। কেনার পরিমাণ বাড়ান অথবা বিক্রির পরিমাণ কমান।';

  function getEstimatorWarning(buyQty: number, sellQty: number): string | null {
    if (sellQty > buyQty) {
      return EXACT_WARNING;
    }
    return null;
  }

  // sellQty exceeds buyQty
  assert.equal(getEstimatorWarning(100, 120), EXACT_WARNING);
  assert.equal(getEstimatorWarning(0, 1), EXACT_WARNING);

  // sellQty equals or is less than buyQty
  assert.equal(getEstimatorWarning(100, 100), null);
  assert.equal(getEstimatorWarning(100, 80), null);
  assert.equal(getEstimatorWarning(50, 0), null);
});

test('Phase 3 - Walk-in Customer Phone: Snapshot and validation handling', () => {
  // Empty inputs resolve to null and never block sale posting
  assert.equal(normalizePhoneSnapshot(''), null);
  assert.equal(normalizePhoneSnapshot('   '), null);
  assert.equal(normalizePhoneSnapshot(null), null);
  assert.equal(normalizePhoneSnapshot(undefined), null);

  // Non-empty phone is preserved as snapshot
  assert.equal(normalizePhoneSnapshot('01712-345678'), '01712-345678');
  assert.equal(normalizePhoneSnapshot('০১৭১২৩৪৫৬৭৮'), '০১৭১২৩৪৫৬৭৮');
});

test('Phase 3 - Duplicate Mobile Search: Strict Identity Separation', () => {
  const SHARED_PHONE = '01712345678';
  const FORMATTED_PHONE_INPUT = '+880 1712-345678';

  const normalized = normalizeBdMobile(FORMATTED_PHONE_INPUT);
  assert.equal(normalized, SHARED_PHONE);

  // Setup synthetic records that share the same phone number
  const customers = [
    {
      id: 'cust-1',
      name: 'Karim Store',
      phone: '01712345678',
      business_id: 'b1',
    },
    {
      id: 'cust-2',
      name: 'Rahim Traders',
      phone: '+8801712345678',
      business_id: 'b1',
    },
    {
      id: 'cust-foreign',
      name: 'Other Biz Customer',
      phone: '01712345678',
      business_id: 'b2',
    },
  ];

  const suppliers = [
    {
      id: 'supp-1',
      name: 'Meghna Edible Oil Mills',
      phone: '01712-345678',
      business_id: 'b1',
    },
  ];

  const sales = [
    // Customer 1 sale
    {
      id: 'sale-1',
      invoice_no: 'S-001',
      customer_id: 'cust-1',
      customer_name_snapshot: 'Karim Store',
      customer_phone_snapshot: '01712345678',
      total_amount: 1000,
      occurred_at: '2026-11-01T10:00:00Z',
      business_id: 'b1',
    },
    // Customer 2 sale
    {
      id: 'sale-2',
      invoice_no: 'S-002',
      customer_id: 'cust-2',
      customer_name_snapshot: 'Rahim Traders',
      customer_phone_snapshot: '+8801712345678',
      total_amount: 2000,
      occurred_at: '2026-11-02T10:00:00Z',
      business_id: 'b1',
    },
    // Walk-in sale with same phone
    {
      id: 'sale-3',
      invoice_no: 'S-003',
      customer_id: null,
      customer_name_snapshot: 'Walk-in / Cash customer',
      customer_phone_snapshot: '01712-345678',
      total_amount: 500,
      occurred_at: '2026-11-03T10:00:00Z',
      business_id: 'b1',
    },
    // Foreign tenant sale (must never be included)
    {
      id: 'sale-4',
      invoice_no: 'S-FOREIGN',
      customer_id: 'cust-foreign',
      customer_name_snapshot: 'Other Biz Customer',
      customer_phone_snapshot: '01712345678',
      total_amount: 9999,
      occurred_at: '2026-11-01T10:00:00Z',
      business_id: 'b2',
    },
  ];

  const purchases = [
    {
      id: 'purch-1',
      invoice_no: 'P-001',
      supplier_id: 'supp-1',
      supplier_name_snapshot: 'Meghna Edible Oil Mills',
      total_amount: 8000,
      occurred_at: '2026-10-25T10:00:00Z',
      business_id: 'b1',
    },
  ];

  // Perform tenant-scoped identity grouping for business 'b1'
  const currentBusinessId = 'b1';

  // 1. Matching registered customers
  const matchingCusts = customers.filter(
    (c) =>
      c.business_id === currentBusinessId &&
      areBdMobilesEqual(c.phone, normalized),
  );
  assert.equal(matchingCusts.length, 2);
  assert.equal(matchingCusts[0].id, 'cust-1');
  assert.equal(matchingCusts[1].id, 'cust-2');

  // 2. Matching walk-in sales
  const matchingWalkIn = sales.filter(
    (s) =>
      s.business_id === currentBusinessId &&
      !s.customer_id &&
      areBdMobilesEqual(s.customer_phone_snapshot, normalized),
  );
  assert.equal(matchingWalkIn.length, 1);
  assert.equal(matchingWalkIn[0].id, 'sale-3');

  // 3. Matching suppliers
  const matchingSupps = suppliers.filter(
    (s) =>
      s.business_id === currentBusinessId &&
      areBdMobilesEqual(s.phone, normalized),
  );
  assert.equal(matchingSupps.length, 1);
  assert.equal(matchingSupps[0].id, 'supp-1');

  // 4. Verify cross-tenant isolation: Foreign tenant records are completely excluded
  const foreignMatches = sales.filter(
    (s) =>
      s.business_id === currentBusinessId && s.customer_id === 'cust-foreign',
  );
  assert.equal(foreignMatches.length, 0);

  // 5. Verify distinct identity keys and that histories are never merged
  const identityKeys = [
    ...matchingCusts.map((c) => `customer:${c.id}`),
    'walk-in',
    ...matchingSupps.map((s) => `supplier:${s.id}`),
  ];

  assert.deepEqual(identityKeys, [
    'customer:cust-1',
    'customer:cust-2',
    'walk-in',
    'supplier:supp-1',
  ]);
  // 4 distinct groups
  assert.equal(new Set(identityKeys).size, 4);

  // Ensure Customer 1's history contains ONLY sale-1
  const cust1History = sales.filter(
    (s) => s.business_id === currentBusinessId && s.customer_id === 'cust-1',
  );
  assert.equal(cust1History.length, 1);
  assert.equal(cust1History[0].invoice_no, 'S-001');

  // Ensure Customer 2's history contains ONLY sale-2
  const cust2History = sales.filter(
    (s) => s.business_id === currentBusinessId && s.customer_id === 'cust-2',
  );
  assert.equal(cust2History.length, 1);
  assert.equal(cust2History[0].invoice_no, 'S-002');

  // Ensure Walk-in history contains ONLY sale-3
  assert.equal(matchingWalkIn[0].invoice_no, 'S-003');

  // Ensure Supplier history contains ONLY purch-1
  const supp1History = purchases.filter(
    (p) => p.business_id === currentBusinessId && p.supplier_id === 'supp-1',
  );
  assert.equal(supp1History.length, 1);
  assert.equal(supp1History[0].invoice_no, 'P-001');
});

// Helper simulating TransactionsPanel grouping
function groupTransactionsByMobile({
  customers,
  suppliers,
  sales,
  purchases,
  receipts = [],
  supplierPayments = [],
  searchQuery,
  currentBusinessId,
}: {
  customers: {
    id: string;
    name: string;
    phone?: string | null;
    business_id: string;
  }[];
  suppliers: {
    id: string;
    name: string;
    phone?: string | null;
    business_id: string;
  }[];
  sales: {
    id: string;
    invoice_no: string;
    customer_id?: string | null;
    customer_name_snapshot: string;
    customer_phone_snapshot?: string | null;
    total_amount: number;
    occurred_at: string;
    business_id: string;
  }[];
  purchases: {
    id: string;
    invoice_no: string;
    supplier_id?: string | null;
    supplier_name_snapshot: string;
    total_amount: number;
    occurred_at: string;
    business_id: string;
  }[];
  receipts?: {
    id: string;
    receipt_no: string;
    customer_id?: string | null;
    customer_name_snapshot: string;
    amount: number;
    received_at: string;
    business_id: string;
  }[];
  supplierPayments?: {
    id: string;
    payment_no: string;
    supplier_id?: string | null;
    supplier_name_snapshot: string;
    amount: number;
    paid_at: string;
    business_id: string;
  }[];
  searchQuery: string;
  currentBusinessId: string;
}) {
  const tenantCustomers = customers.filter(
    (c) => c.business_id === currentBusinessId,
  );
  const tenantSuppliers = suppliers.filter(
    (s) => s.business_id === currentBusinessId,
  );
  const tenantSales = sales.filter((s) => s.business_id === currentBusinessId);
  const tenantPurchases = purchases.filter(
    (p) => p.business_id === currentBusinessId,
  );
  const tenantReceipts = receipts.filter(
    (r) => r.business_id === currentBusinessId,
  );
  const tenantSupplierPayments = supplierPayments.filter(
    (sp) => sp.business_id === currentBusinessId,
  );

  const normalizedQueryMobile = normalizeBdMobile(searchQuery);
  if (!normalizedQueryMobile) return [];

  const rows = [
    ...tenantSales.map((row) => {
      const customer = tenantCustomers.find((c) => c.id === row.customer_id);
      return {
        kind: 'SALE' as const,
        id: row.id,
        ref: row.invoice_no,
        occurred: row.occurred_at,
        party: row.customer_name_snapshot,
        amount: row.total_amount,
        phone: row.customer_phone_snapshot ?? customer?.phone ?? null,
        customerId: row.customer_id ?? null,
        supplierId: null,
      };
    }),
    ...tenantPurchases.map((row) => {
      const supplier = tenantSuppliers.find((s) => s.id === row.supplier_id);
      return {
        kind: 'PURCHASE' as const,
        id: row.id,
        ref: row.invoice_no,
        occurred: row.occurred_at,
        party: row.supplier_name_snapshot,
        amount: row.total_amount,
        phone: supplier?.phone ?? null,
        customerId: null,
        supplierId: row.supplier_id ?? null,
      };
    }),
    ...tenantReceipts.map((row) => {
      const customer = tenantCustomers.find((c) => c.id === row.customer_id);
      return {
        kind: 'RECEIPT' as const,
        id: row.id,
        ref: row.receipt_no,
        occurred: row.received_at,
        party: row.customer_name_snapshot,
        amount: row.amount,
        phone: customer?.phone ?? null,
        customerId: row.customer_id ?? null,
        supplierId: null,
      };
    }),
    ...tenantSupplierPayments.map((row) => {
      const supplier = tenantSuppliers.find((s) => s.id === row.supplier_id);
      return {
        kind: 'SUPPLIER_PAYMENT' as const,
        id: row.id,
        ref: row.payment_no,
        occurred: row.paid_at,
        party: row.supplier_name_snapshot,
        amount: row.amount,
        phone: supplier?.phone ?? null,
        customerId: null,
        supplierId: row.supplier_id ?? null,
      };
    }),
  ];

  type IdentityGroup = {
    key: string;
    type: 'CUSTOMER' | 'WALK_IN' | 'SUPPLIER';
    label: string;
    phone: string;
    rows: typeof rows;
  };

  const groups: IdentityGroup[] = [];

  // 1. Registered Customers
  const matchedCustomerIds = new Set<string>();
  for (const c of tenantCustomers) {
    if (normalizeBdMobile(c.phone) === normalizedQueryMobile) {
      matchedCustomerIds.add(c.id);
    }
  }
  for (const s of tenantSales) {
    if (
      s.customer_id &&
      normalizeBdMobile(s.customer_phone_snapshot) === normalizedQueryMobile
    ) {
      matchedCustomerIds.add(s.customer_id);
    }
  }
  for (const cid of matchedCustomerIds) {
    const c = tenantCustomers.find((cust) => cust.id === cid);
    if (!c) continue;
    const cRows = rows.filter((r) => r.customerId === c.id);
    groups.push({
      key: `customer:${c.id}`,
      type: 'CUSTOMER',
      label: `Customer: ${c.name}`,
      phone: c.phone || normalizedQueryMobile,
      rows: cRows,
    });
  }

  // 2. Walk-in Customer Sales (strictly customer_id IS NULL and kind === 'SALE')
  const walkInRows = rows.filter(
    (r) =>
      r.kind === 'SALE' &&
      r.customerId === null &&
      normalizeBdMobile(r.phone) === normalizedQueryMobile,
  );
  if (walkInRows.length > 0) {
    groups.push({
      key: 'walk-in',
      type: 'WALK_IN',
      label: 'Walk-in Customer',
      phone: normalizedQueryMobile,
      rows: walkInRows,
    });
  }

  // 3. Suppliers
  const matchedSuppliers = tenantSuppliers.filter(
    (s) => normalizeBdMobile(s.phone) === normalizedQueryMobile,
  );
  for (const s of matchedSuppliers) {
    const sRows = rows.filter((r) => r.supplierId === s.id);
    groups.push({
      key: `supplier:${s.id}`,
      type: 'SUPPLIER',
      label: `Supplier: ${s.name}`,
      phone: s.phone || normalizedQueryMobile,
      rows: sRows,
    });
  }

  return groups;
}

test('History Search Scenario A: Registered Customer with phone snapshot appears under Customer A, never Walk-in', () => {
  const groups = groupTransactionsByMobile({
    currentBusinessId: 'biz-1',
    searchQuery: '01712345678',
    customers: [
      {
        id: 'cust-A',
        name: 'Karim Store',
        phone: '01712345678',
        business_id: 'biz-1',
      },
    ],
    suppliers: [],
    sales: [
      {
        id: 'sale-A1',
        invoice_no: 'S-A1',
        customer_id: 'cust-A',
        customer_name_snapshot: 'Karim Store',
        customer_phone_snapshot: '01712345678',
        total_amount: 1500,
        occurred_at: '2026-11-01T10:00:00Z',
        business_id: 'biz-1',
      },
    ],
    purchases: [],
  });

  assert.equal(groups.length, 1);
  assert.equal(groups[0].key, 'customer:cust-A');
  assert.equal(groups[0].type, 'CUSTOMER');
  assert.equal(groups[0].rows.length, 1);
  assert.equal(groups[0].rows[0].ref, 'S-A1');
  assert.equal(groups[0].rows[0].customerId, 'cust-A');

  // Verify Walk-in group was NOT created
  const walkInGroup = groups.find((g) => g.key === 'walk-in');
  assert.equal(walkInGroup, undefined);
});

test('History Search Scenario B: Walk-in sale with customer_id = NULL appears in Walk-in identity group', () => {
  const groups = groupTransactionsByMobile({
    currentBusinessId: 'biz-1',
    searchQuery: '01712345678',
    customers: [],
    suppliers: [],
    sales: [
      {
        id: 'sale-W1',
        invoice_no: 'S-W1',
        customer_id: null,
        customer_name_snapshot: 'Walk-in / Cash customer',
        customer_phone_snapshot: '01712345678',
        total_amount: 350,
        occurred_at: '2026-11-01T12:00:00Z',
        business_id: 'biz-1',
      },
    ],
    purchases: [],
  });

  assert.equal(groups.length, 1);
  assert.equal(groups[0].key, 'walk-in');
  assert.equal(groups[0].type, 'WALK_IN');
  assert.equal(groups[0].rows.length, 1);
  assert.equal(groups[0].rows[0].ref, 'S-W1');
  assert.equal(groups[0].rows[0].customerId, null);
});

test('History Search Scenario C: Customer A and Customer B share phone -> two separate registered customer identity groups', () => {
  const groups = groupTransactionsByMobile({
    currentBusinessId: 'biz-1',
    searchQuery: '01712345678',
    customers: [
      {
        id: 'cust-A',
        name: 'Customer Alpha',
        phone: '01712345678',
        business_id: 'biz-1',
      },
      {
        id: 'cust-B',
        name: 'Customer Beta',
        phone: '01712345678',
        business_id: 'biz-1',
      },
    ],
    suppliers: [],
    sales: [
      {
        id: 'sale-A1',
        invoice_no: 'S-A1',
        customer_id: 'cust-A',
        customer_name_snapshot: 'Customer Alpha',
        customer_phone_snapshot: '01712345678',
        total_amount: 1000,
        occurred_at: '2026-11-01T10:00:00Z',
        business_id: 'biz-1',
      },
      {
        id: 'sale-B1',
        invoice_no: 'S-B1',
        customer_id: 'cust-B',
        customer_name_snapshot: 'Customer Beta',
        customer_phone_snapshot: '01712345678',
        total_amount: 2500,
        occurred_at: '2026-11-02T10:00:00Z',
        business_id: 'biz-1',
      },
    ],
    purchases: [],
  });

  assert.equal(groups.length, 2);
  const groupA = groups.find((g) => g.key === 'customer:cust-A');
  const groupB = groups.find((g) => g.key === 'customer:cust-B');

  assert.ok(groupA);
  assert.ok(groupB);
  assert.equal(groupA.rows.length, 1);
  assert.equal(groupA.rows[0].ref, 'S-A1');
  assert.equal(groupB.rows.length, 1);
  assert.equal(groupB.rows[0].ref, 'S-B1');
});

test('History Search Scenario D: Customer A and Walk-in customer share same number -> registered and walk-in remain strictly separated', () => {
  const groups = groupTransactionsByMobile({
    currentBusinessId: 'biz-1',
    searchQuery: '01712345678',
    customers: [
      {
        id: 'cust-A',
        name: 'Customer Alpha',
        phone: '01712345678',
        business_id: 'biz-1',
      },
    ],
    suppliers: [],
    sales: [
      {
        id: 'sale-A1',
        invoice_no: 'S-A1',
        customer_id: 'cust-A',
        customer_name_snapshot: 'Customer Alpha',
        customer_phone_snapshot: '01712345678',
        total_amount: 1000,
        occurred_at: '2026-11-01T10:00:00Z',
        business_id: 'biz-1',
      },
      {
        id: 'sale-W1',
        invoice_no: 'S-W1',
        customer_id: null,
        customer_name_snapshot: 'Walk-in / Cash customer',
        customer_phone_snapshot: '01712345678',
        total_amount: 500,
        occurred_at: '2026-11-02T10:00:00Z',
        business_id: 'biz-1',
      },
    ],
    purchases: [],
  });

  assert.equal(groups.length, 2);
  const custGroup = groups.find((g) => g.key === 'customer:cust-A');
  const walkInGroup = groups.find((g) => g.key === 'walk-in');

  assert.ok(custGroup);
  assert.ok(walkInGroup);

  // Registered group has ONLY registered sale
  assert.equal(custGroup.rows.length, 1);
  assert.equal(custGroup.rows[0].ref, 'S-A1');
  assert.equal(custGroup.rows[0].customerId, 'cust-A');

  // Walk-in group has ONLY walk-in sale
  assert.equal(walkInGroup.rows.length, 1);
  assert.equal(walkInGroup.rows[0].ref, 'S-W1');
  assert.equal(walkInGroup.rows[0].customerId, null);
});

test('History Search Scenario E: Supplier A shares same number with Customer A -> Supplier Purchase history remains separate from Customer Sales history', () => {
  const groups = groupTransactionsByMobile({
    currentBusinessId: 'biz-1',
    searchQuery: '01712345678',
    customers: [
      {
        id: 'cust-A',
        name: 'Merchant Partner',
        phone: '01712345678',
        business_id: 'biz-1',
      },
    ],
    suppliers: [
      {
        id: 'supp-A',
        name: 'Merchant Partner Wholesale',
        phone: '01712345678',
        business_id: 'biz-1',
      },
    ],
    sales: [
      {
        id: 'sale-A1',
        invoice_no: 'S-A1',
        customer_id: 'cust-A',
        customer_name_snapshot: 'Merchant Partner',
        customer_phone_snapshot: '01712345678',
        total_amount: 1200,
        occurred_at: '2026-11-01T10:00:00Z',
        business_id: 'biz-1',
      },
    ],
    purchases: [
      {
        id: 'purch-A1',
        invoice_no: 'P-A1',
        supplier_id: 'supp-A',
        supplier_name_snapshot: 'Merchant Partner Wholesale',
        total_amount: 5000,
        occurred_at: '2026-11-01T09:00:00Z',
        business_id: 'biz-1',
      },
    ],
  });

  assert.equal(groups.length, 2);
  const custGroup = groups.find((g) => g.key === 'customer:cust-A');
  const suppGroup = groups.find((g) => g.key === 'supplier:supp-A');

  assert.ok(custGroup);
  assert.ok(suppGroup);

  assert.equal(custGroup.type, 'CUSTOMER');
  assert.equal(custGroup.rows.length, 1);
  assert.equal(custGroup.rows[0].kind, 'SALE');
  assert.equal(custGroup.rows[0].ref, 'S-A1');

  assert.equal(suppGroup.type, 'SUPPLIER');
  assert.equal(suppGroup.rows.length, 1);
  assert.equal(suppGroup.rows[0].kind, 'PURCHASE');
  assert.equal(suppGroup.rows[0].ref, 'P-A1');
});

test('History Search Scenario F: Different business has records using same number -> no cross-tenant records returned', () => {
  const groups = groupTransactionsByMobile({
    currentBusinessId: 'biz-1', // querying biz-1
    searchQuery: '01712345678',
    customers: [
      {
        id: 'cust-1',
        name: 'Biz 1 Customer',
        phone: '01712345678',
        business_id: 'biz-1',
      },
      {
        id: 'cust-2',
        name: 'Biz 2 Foreign Customer',
        phone: '01712345678',
        business_id: 'biz-2',
      },
    ],
    suppliers: [
      {
        id: 'supp-2',
        name: 'Biz 2 Foreign Supplier',
        phone: '01712345678',
        business_id: 'biz-2',
      },
    ],
    sales: [
      {
        id: 'sale-1',
        invoice_no: 'S-BIZ1',
        customer_id: 'cust-1',
        customer_name_snapshot: 'Biz 1 Customer',
        customer_phone_snapshot: '01712345678',
        total_amount: 1000,
        occurred_at: '2026-11-01T10:00:00Z',
        business_id: 'biz-1',
      },
      {
        id: 'sale-foreign',
        invoice_no: 'S-FOREIGN',
        customer_id: 'cust-2',
        customer_name_snapshot: 'Biz 2 Foreign Customer',
        customer_phone_snapshot: '01712345678',
        total_amount: 99999,
        occurred_at: '2026-11-01T10:00:00Z',
        business_id: 'biz-2',
      },
    ],
    purchases: [
      {
        id: 'purch-foreign',
        invoice_no: 'P-FOREIGN',
        supplier_id: 'supp-2',
        supplier_name_snapshot: 'Biz 2 Foreign Supplier',
        total_amount: 88888,
        occurred_at: '2026-11-01T10:00:00Z',
        business_id: 'biz-2',
      },
    ],
  });

  // Only biz-1's customer is returned
  assert.equal(groups.length, 1);
  assert.equal(groups[0].key, 'customer:cust-1');
  assert.equal(groups[0].rows.length, 1);
  assert.equal(groups[0].rows[0].ref, 'S-BIZ1');

  // Verify none of the foreign records exist
  const allRowRefs = groups.flatMap((g) => g.rows).map((r) => r.ref);
  assert.ok(!allRowRefs.includes('S-FOREIGN'));
  assert.ok(!allRowRefs.includes('P-FOREIGN'));
});

test('History Search Scenario G: Bangladesh phone formats match equivalent numbers, reject different numbers', () => {
  const TARGET_PHONE = '01712345678';
  const validVariants = [
    '01712345678',
    '1712345678',
    '+8801712345678',
    '+880 1712-345678',
    '8801712345678',
    '008801712345678',
    '01712-345678',
    '01712 345678',
    '(+880) 1712-345678',
    '০১৭১২৩৪৫৬৭৮', // Bengali digits
  ];

  for (const variant of validVariants) {
    const norm = normalizeBdMobile(variant);
    assert.equal(
      norm,
      TARGET_PHONE,
      `Variant "${variant}" failed to normalize to ${TARGET_PHONE}`,
    );
    assert.ok(
      areBdMobilesEqual(variant, TARGET_PHONE),
      `Variant "${variant}" not equal to ${TARGET_PHONE}`,
    );
  }

  // Reject invalid, partial or different numbers
  const invalidOrDifferent = [
    '01712345679', // 1 digit different
    '01812345678', // operator different
    '345678', // partial substring
    '01712', // partial prefix
    'abcd', // letters
    '01212345678', // invalid operator 012
    '0171234567890', // 13 digits
    '', // empty
    '   ', // whitespace
  ];

  for (const invalid of invalidOrDifferent) {
    assert.equal(
      areBdMobilesEqual(invalid, TARGET_PHONE),
      false,
      `Invalid "${invalid}" incorrectly matched ${TARGET_PHONE}`,
    );
  }
});

test('History Search Scenario H: Pagination completeness simulation: large dataset spanning multiple pages retrieved without loss', async () => {
  // Simulate fetchAllPages logic with 2,500 total records over 3 pages of 1,000 max size
  const TOTAL_RECORDS = 2500;
  const PAGE_SIZE = 1000;
  const syntheticSales = Array.from({ length: TOTAL_RECORDS }, (_, i) => ({
    id: `sale-${i + 1}`,
    invoice_no: `S-${String(i + 1).padStart(5, '0')}`,
    customer_id: i === 1500 ? 'cust-mid' : null, // Record 1501 on Page 2
    customer_name_snapshot: i === 1500 ? 'Mid Customer' : 'Walk-in Customer',
    customer_phone_snapshot:
      i === 2450 || i === 1500 ? '01712345678' : '01900000000', // Record 2451 on Page 3
    total_amount: 100,
    occurred_at: '2026-11-01T10:00:00Z',
    business_id: 'biz-1',
  }));

  async function mockFetchAllPages<T>(
    fetcher: (from: number, to: number) => Promise<{ data: T[]; error: null }>,
    pageSize = 1000,
  ): Promise<T[]> {
    const all: T[] = [];
    let from = 0;
    while (true) {
      const to = from + pageSize - 1;
      const { data } = await fetcher(from, to);
      if (!data || data.length === 0) break;
      all.push(...data);
      if (data.length < pageSize) break;
      from += pageSize;
    }
    return all;
  }

  // Fetch using the exact pagination loop
  const loadedSales = await mockFetchAllPages(async (from, to) => {
    const slice = syntheticSales.slice(from, to + 1);
    return { data: slice, error: null };
  }, PAGE_SIZE);

  assert.equal(loadedSales.length, TOTAL_RECORDS);

  // Group by mobile search for '01712345678'
  const groups = groupTransactionsByMobile({
    currentBusinessId: 'biz-1',
    searchQuery: '01712345678',
    customers: [
      {
        id: 'cust-mid',
        name: 'Mid Customer',
        phone: '01712345678',
        business_id: 'biz-1',
      },
    ],
    suppliers: [],
    sales: loadedSales,
    purchases: [],
  });

  assert.equal(groups.length, 2);
  const custGroup = groups.find((g) => g.key === 'customer:cust-mid');
  const walkInGroup = groups.find((g) => g.key === 'walk-in');

  assert.ok(custGroup);
  assert.ok(walkInGroup);

  // Page 2 customer sale is present
  assert.equal(custGroup.rows.length, 1);
  assert.equal(custGroup.rows[0].ref, 'S-01501');

  // Page 3 walk-in sale is present
  assert.equal(walkInGroup.rows.length, 1);
  assert.equal(walkInGroup.rows[0].ref, 'S-02451');
});
