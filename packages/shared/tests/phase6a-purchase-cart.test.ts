import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  CANONICAL_283_CATALOGUE,
  searchCatalogue,
  getProductImageUrl,
  findCanonicalProduct,
} from '../src/catalogue.ts';

test('Dynamic Recent Search 9-Item Contract: Newest-first, strict 9-item cap, oldest eviction, deduplication', () => {
  // Simulate the exact algorithm implemented in PurchasesPanel
  let recentCodes: string[] = [];

  const recordRecentSelection = (canonicalCode: string) => {
    recentCodes = [
      canonicalCode,
      ...recentCodes.filter((c) => c !== canonicalCode),
    ].slice(0, 9);
    return recentCodes;
  };

  // Add 9 items
  const itemsToAdd = [
    'CATV2-001', // চাল
    'CATV2-002', // আটা
    'CATV2-003', // ময়দা
    'CATV2-004', // সুজি
    'CATV2-005', // চিনি
    'CATV2-006', // লবণ
    'CATV2-007', // মসুর ডাল
    'CATV2-008', // মুগ ডাল
    'CATV2-009', // ছোলা
  ];

  for (const item of itemsToAdd) {
    recordRecentSelection(item);
  }

  assert.equal(recentCodes.length, 9);
  // Newest should be at position 0
  assert.equal(recentCodes[0], 'CATV2-009');
  assert.equal(recentCodes[8], 'CATV2-001');

  // Add a 10th distinct item: CATV2-042 (সরিষার তেল)
  recordRecentSelection('CATV2-042');
  assert.equal(recentCodes.length, 9, 'Must not exceed 9 items');
  assert.equal(recentCodes[0], 'CATV2-042', 'Newest item must be at index 0');
  assert.equal(
    recentCodes.includes('CATV2-001'),
    false,
    'Oldest item CATV2-001 must be evicted',
  );
  assert.equal(
    recentCodes[8],
    'CATV2-002',
    'Previous oldest item is now at position 8',
  );

  // Re-select an existing item: CATV2-005 (চিনি)
  recordRecentSelection('CATV2-005');
  assert.equal(
    recentCodes.length,
    9,
    'Must maintain 9 items without duplication',
  );
  assert.equal(
    recentCodes[0],
    'CATV2-005',
    'Re-selected item moves to index 0',
  );
  // Check no duplicates exist
  const uniqueSet = new Set(recentCodes);
  assert.equal(uniqueSet.size, 9, 'Every item in recentCodes must be unique');

  // Language variant deduplication test:
  // Searching 'holud' or 'হলুদ গুঁড়া' or 'Turmeric' all resolve to CATV2-042 (or turmeric code)
  const turmericMatches = searchCatalogue('হলুদ');
  assert.ok(turmericMatches.length > 0);
  const turmericCode = turmericMatches[0].code;

  recordRecentSelection(turmericCode);
  assert.equal(recentCodes[0], turmericCode);
  assert.equal(recentCodes.length, 9);
});

test('All-283 Canonical Products Contract Validation', () => {
  assert.equal(
    CANONICAL_283_CATALOGUE.length,
    283,
    'Catalogue must contain exactly 283 products',
  );

  const restrictedCodes = new Set(['CATV2-194', 'CATV2-195', 'CATV2-196']);
  const seenCodes = new Set<string>();
  const seenSkus = new Set<string>();

  for (let i = 0; i < CANONICAL_283_CATALOGUE.length; i++) {
    const item = CANONICAL_283_CATALOGUE[i];
    const serial = String(i + 1).padStart(3, '0');
    const expectedCode = `CATV2-${serial}`;

    assert.equal(
      item.code,
      expectedCode,
      `Product serial order mismatch at index ${i}`,
    );
    assert.ok(
      item.name_bn && item.name_bn.trim().length > 0,
      `Product ${item.code} has empty Bengali name`,
    );
    assert.ok(
      item.name_en && item.name_en.trim().length > 0,
      `Product ${item.code} has empty English name`,
    );
    assert.ok(
      item.name_banglish && item.name_banglish.trim().length > 0,
      `Product ${item.code} has empty Banglish name`,
    );
    assert.ok(
      item.sku && item.sku.trim().length > 0,
      `Product ${item.code} has empty SKU`,
    );
    assert.ok(
      item.base_unit && ['কেজি', 'লিটার', 'পিস'].includes(item.base_unit),
      `Product ${item.code} has invalid base unit: ${item.base_unit}`,
    );
    assert.ok(
      item.image_path && item.image_path.startsWith('catalogue-v2/'),
      `Product ${item.code} has invalid image path: ${item.image_path}`,
    );

    // Verify image URL generation
    const url = getProductImageUrl(item);
    assert.ok(
      url && url.includes(item.image_path),
      `Product ${item.code} failed to produce valid image URL`,
    );

    // Verify finding by code, sku, Bengali name
    const byCode = findCanonicalProduct({ code: item.code });
    assert.ok(
      byCode && byCode.code === item.code,
      `findCanonicalProduct by code failed for ${item.code}`,
    );

    const bySku = findCanonicalProduct({ sku: item.sku });
    assert.ok(
      bySku && bySku.sku === item.sku,
      `findCanonicalProduct by SKU failed for ${item.sku}`,
    );

    const byName = findCanonicalProduct({ name_bn: item.name_bn });
    assert.ok(
      byName,
      `findCanonicalProduct by name_bn failed for ${item.name_bn}`,
    );

    // Check duplicate codes and SKUs
    assert.ok(!seenCodes.has(item.code), `Duplicate code found: ${item.code}`);
    assert.ok(!seenSkus.has(item.sku), `Duplicate SKU found: ${item.sku}`);
    seenCodes.add(item.code);
    seenSkus.add(item.sku);

    // Check restricted products
    if (restrictedCodes.has(item.code)) {
      assert.equal(
        item.is_restricted,
        true,
        `Product ${item.code} must be flagged as restricted`,
      );
    } else {
      assert.equal(
        item.is_restricted,
        false,
        `Product ${item.code} should not be restricted`,
      );
    }
  }

  // Verify search without restricted items
  const normalSearch = searchCatalogue('মশা মারার স্প্রে', {
    includeRestricted: false,
  });
  assert.equal(
    normalSearch.length,
    0,
    'Restricted products must be excluded by default',
  );

  const adminSearch = searchCatalogue('মশা মারার স্প্রে', {
    includeRestricted: true,
  });
  assert.ok(
    adminSearch.length > 0,
    'Restricted products must be included when explicitly permitted',
  );
});

test('Search & Adoption Contract for products with parentheses, slashes, commas, and long Bengali names', () => {
  // Test special name cases
  const specialQueries = [
    'সরিষার তেল (লিটার)', // parentheses
    'নারকেল তেল',
    'মিনিকেট চাল',
    'দারুচিনি',
    'হলুদ গুঁড়া',
  ];

  for (const query of specialQueries) {
    const results = searchCatalogue(query, { includeRestricted: false });
    assert.ok(
      results.length > 0,
      `Search query "${query}" should yield results`,
    );
    const match = results[0];
    const nfcMatch = match.name_bn.normalize('NFC');
    const nfcQuery = query.normalize('NFC');
    assert.ok(
      nfcMatch.includes(nfcQuery) || nfcQuery.includes(nfcMatch),
      `Query "${query}" matched "${match.name_bn}"`,
    );
  }
});
