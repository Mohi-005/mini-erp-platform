import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getCatalogueImageUrl,
  findCanonicalProduct,
  getProductImageUrl,
  DEFAULT_SUPABASE_STORAGE_URL,
} from '../src/catalogue.ts';

test('getCatalogueImageUrl constructs canonical storage URLs', () => {
  const url = getCatalogueImageUrl('catalogue-v2/CATV2-001.webp');
  assert.equal(
    url,
    `${DEFAULT_SUPABASE_STORAGE_URL}/storage/v1/object/public/catalogue-images/catalogue-v2/CATV2-001.webp`,
  );

  // Trims slashes cleanly
  assert.equal(
    getCatalogueImageUrl('/catalogue-v2/CATV2-002.webp'),
    `${DEFAULT_SUPABASE_STORAGE_URL}/storage/v1/object/public/catalogue-images/catalogue-v2/CATV2-002.webp`,
  );

  // Empty or invalid input returns null
  assert.equal(getCatalogueImageUrl(''), null);
  assert.equal(getCatalogueImageUrl(null), null);
  assert.equal(getCatalogueImageUrl('   '), null);

  // Supports custom base URL
  assert.equal(
    getCatalogueImageUrl(
      'catalogue-v2/CATV2-001.webp',
      'https://my-custom-supabase.co/',
    ),
    'https://my-custom-supabase.co/storage/v1/object/public/catalogue-images/catalogue-v2/CATV2-001.webp',
  );
});

test('findCanonicalProduct resolves products by code, sku, or Bengali name', () => {
  // By code
  const byCode = findCanonicalProduct({ code: 'CATV2-001' });
  assert.equal(byCode?.name_bn, 'মিনিকেট চাল');
  assert.equal(byCode?.image_path, 'catalogue-v2/CATV2-001.webp');

  // By SKU
  const bySku = findCanonicalProduct({ sku: 'SKU-CATV2-002' });
  assert.equal(bySku?.name_bn, 'নাজিরশাইল চাল');
  assert.equal(bySku?.image_path, 'catalogue-v2/CATV2-002.webp');

  // By Bengali name
  const byName = findCanonicalProduct({ name_bn: 'সয়াবিন তেল (খোলা)' });
  assert.equal(byName?.code, 'CATV2-039');
  assert.equal(byName?.image_path, 'catalogue-v2/CATV2-039.webp');

  // Litre variant
  const byNameLitre = findCanonicalProduct({ name_bn: 'সয়াবিন তেল (লিটার)' });
  assert.equal(byNameLitre?.code, 'CATV2-040');
  assert.equal(byNameLitre?.image_path, 'catalogue-v2/CATV2-040.webp');

  // Restricted item (Mosquito spray)
  const byRestricted = findCanonicalProduct({ code: 'CATV2-194' });
  assert.equal(byRestricted?.name_bn, 'মশা মারার স্প্রে');
  assert.equal(byRestricted?.image_path, 'catalogue-v2/CATV2-194.webp');

  // Long Bengali name item
  const byLongName = findCanonicalProduct({
    name_bn: 'পোলাওয়ের চাল (কালিজিরা)',
  });
  assert.equal(byLongName?.code, 'CATV2-007');

  // Unknown product returns null
  assert.equal(findCanonicalProduct({ name_bn: 'অপরিচিত কোনো পণ্য' }), null);
});

test('getProductImageUrl resolves correctly for tenant products and catalogue items', () => {
  // Direct image_path
  assert.equal(
    getProductImageUrl({ image_path: 'catalogue-v2/CATV2-001.webp' }),
    `${DEFAULT_SUPABASE_STORAGE_URL}/storage/v1/object/public/catalogue-images/catalogue-v2/CATV2-001.webp`,
  );

  // Tenant product with matching SKU
  assert.equal(
    getProductImageUrl({ sku: 'SKU-CATV2-001', name_bn: 'মিনিকেট চাল' }),
    `${DEFAULT_SUPABASE_STORAGE_URL}/storage/v1/object/public/catalogue-images/catalogue-v2/CATV2-001.webp`,
  );

  // Tenant product with matching Bengali name (even if SKU differs or is missing)
  assert.equal(
    getProductImageUrl({ sku: null, name_bn: 'নাজিরশাইল চাল' }),
    `${DEFAULT_SUPABASE_STORAGE_URL}/storage/v1/object/public/catalogue-images/catalogue-v2/CATV2-002.webp`,
  );

  // Soybean Oil (Loose vs Litre) distinct mappings
  const looseUrl = getProductImageUrl({ name_bn: 'সয়াবিন তেল (খোলা)' });
  const litreUrl = getProductImageUrl({ name_bn: 'সয়াবিন তেল (লিটার)' });
  assert.ok(looseUrl?.includes('CATV2-039.webp'));
  assert.ok(litreUrl?.includes('CATV2-040.webp'));
  assert.notEqual(looseUrl, litreUrl);

  // Custom non-catalogue product returns null gracefully
  assert.equal(getProductImageUrl({ name_bn: 'Custom Shop Item 99' }), null);
  assert.equal(getProductImageUrl(null), null);
});
