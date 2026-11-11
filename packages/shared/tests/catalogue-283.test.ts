import test from 'node:test';
import assert from 'node:assert/strict';
import { CANONICAL_283_CATALOGUE, searchCatalogue } from '../src/catalogue.ts';

test('283-product catalogue contains exactly 283 items', () => {
  assert.equal(CANONICAL_283_CATALOGUE.length, 283);
});

test('Catalogue serials are strictly 001 through 283 in sequential order', () => {
  for (let i = 0; i < 283; i++) {
    const expectedSerial = String(i + 1).padStart(3, '0');
    const item = CANONICAL_283_CATALOGUE[i];
    assert.equal(item.serial, expectedSerial, `Mismatch at index ${i}`);
    assert.equal(item.code, `CATV2-${expectedSerial}`);
    assert.equal(item.sku, `SKU-CATV2-${expectedSerial}`);
  }
});

test('Restricted items are strictly serials 194, 195, and 196', () => {
  const restrictedItems = CANONICAL_283_CATALOGUE.filter(
    (p) => p.is_restricted,
  );
  assert.equal(restrictedItems.length, 3);
  const restrictedSerials = restrictedItems.map((p) => p.serial);
  assert.deepEqual(restrictedSerials, ['194', '195', '196']);

  assert.equal(CANONICAL_283_CATALOGUE[193].name_bn, 'মশা মারার স্প্রে');
  assert.equal(CANONICAL_283_CATALOGUE[194].name_bn, 'তেলাপোকা মারার স্প্রে');
  assert.equal(CANONICAL_283_CATALOGUE[195].name_bn, 'ইঁদুর মারার ওষুধ');
});

test('Search excludes restricted items by default and includes them when requested', () => {
  const normalResults = searchCatalogue('মারার স্প্রে', {
    includeRestricted: false,
  });
  assert.equal(normalResults.length, 0);

  const restrictedResults = searchCatalogue('মারার স্প্রে', {
    includeRestricted: true,
  });
  assert.ok(restrictedResults.length >= 2);
  assert.ok(restrictedResults.some((p) => p.serial === '194'));
  assert.ok(restrictedResults.some((p) => p.serial === '195'));
});

test('Search matches by Bengali name, SKU, and code', () => {
  const byName = searchCatalogue('মিনিকেট');
  assert.ok(byName.length > 0);
  assert.equal(byName[0].name_bn, 'মিনিকেট চাল');
  assert.equal(byName[0].serial, '001');

  const bySku = searchCatalogue('SKU-CATV2-001');
  assert.equal(bySku.length, 1);
  assert.equal(bySku[0].name_bn, 'মিনিকেট চাল');

  const byCode = searchCatalogue('CATV2-002');
  assert.equal(byCode.length, 1);
  assert.equal(byCode[0].name_bn, 'নাজিরশাইল চাল');
});

test('Every product has a non-empty category and valid base unit', () => {
  const validBaseUnits = new Set(['কেজি', 'লিটার', 'পিস', 'মিটার']);
  for (const item of CANONICAL_283_CATALOGUE) {
    assert.ok(item.name_bn && item.name_bn.trim().length > 0);
    assert.ok(item.category_bn && item.category_bn.trim().length > 0);
    assert.ok(
      validBaseUnits.has(item.base_unit),
      `Invalid base unit ${item.base_unit} for ${item.name_bn}`,
    );
  }
});

test('Validates full serial-to-name mapping, SKUs, and restricted items 194-196', () => {
  assert.equal(CANONICAL_283_CATALOGUE.length, 283);
  const seenCodes = new Set<string>();
  const seenSkus = new Set<string>();

  for (let i = 0; i < 283; i++) {
    const item = CANONICAL_283_CATALOGUE[i];
    const expectedSerial = String(i + 1).padStart(3, '0');
    assert.equal(item.serial, expectedSerial);
    assert.equal(item.code, `CATV2-${expectedSerial}`);
    assert.equal(item.sku, `SKU-CATV2-${expectedSerial}`);

    // Uniqueness
    assert.ok(!seenCodes.has(item.code), `Duplicate code ${item.code}`);
    assert.ok(!seenSkus.has(item.sku), `Duplicate sku ${item.sku}`);
    seenCodes.add(item.code);
    seenSkus.add(item.sku);

    // Exact restricted items
    if (item.serial === '194') {
      assert.equal(item.name_bn, 'মশা মারার স্প্রে');
      assert.equal(item.is_restricted, true);
    } else if (item.serial === '195') {
      assert.equal(item.name_bn, 'তেলাপোকা মারার স্প্রে');
      assert.equal(item.is_restricted, true);
    } else if (item.serial === '196') {
      assert.equal(item.name_bn, 'ইঁদুর মারার ওষুধ');
      assert.equal(item.is_restricted, true);
    } else {
      assert.equal(
        item.is_restricted,
        false,
        `Item ${item.serial} should not be restricted`,
      );
    }
  }

  assert.equal(seenCodes.size, 283);
  assert.equal(seenSkus.size, 283);
});

test('Every product has non-empty English name, Banglish name, and canonical image path', () => {
  for (const item of CANONICAL_283_CATALOGUE) {
    assert.ok(
      item.name_en && item.name_en.trim().length > 0,
      `Missing English name for ${item.code}`,
    );
    assert.ok(
      item.name_banglish && item.name_banglish.trim().length > 0,
      `Missing Banglish name for ${item.code}`,
    );
    assert.ok(
      item.image_path && item.image_path.startsWith('catalogue-v2/'),
      `Invalid image path for ${item.code}`,
    );
    assert.equal(item.image_path, `catalogue-v2/${item.code}.webp`);
  }
});

test('Trilingual search matches by Bengali, English, and Banglish terms', () => {
  // Bengali
  const resBn = searchCatalogue('মিনিকেট');
  assert.ok(resBn.length > 0);
  assert.equal(resBn[0].code, 'CATV2-001');

  // English
  const resEn = searchCatalogue('Potato');
  assert.ok(resEn.length > 0);
  assert.equal(resEn[0].code, 'CATV2-102');
  assert.equal(resEn[0].name_bn, 'আলু');
  assert.equal(resEn[0].name_en, 'Potato');

  // Banglish
  const resBg = searchCatalogue('Miniket Chal');
  assert.ok(resBg.length > 0);
  assert.equal(resBg[0].code, 'CATV2-001');

  const resBg2 = searchCatalogue('Alu');
  assert.ok(resBg2.length > 0);
  assert.equal(resBg2[0].code, 'CATV2-102');

  const resBg3 = searchCatalogue('Morich Gura');
  assert.ok(resBg3.length > 0);
  assert.equal(resBg3[0].name_bn, 'মরিচ গুঁড়া');
});

test('Exact trilingual search regression for rice and edible oil products', () => {
  // CATV2-001 checks
  const qMiniketBn = searchCatalogue('মিনিকেট চাল');
  assert.equal(qMiniketBn.length, 1);
  assert.equal(qMiniketBn[0].code, 'CATV2-001');

  const qMiniketEn = searchCatalogue('Miniket Rice');
  assert.equal(qMiniketEn.length, 1);
  assert.equal(qMiniketEn[0].code, 'CATV2-001');

  const qMiniketBg = searchCatalogue('Miniket Chal');
  assert.equal(qMiniketBg.length, 1);
  assert.equal(qMiniketBg[0].code, 'CATV2-001');

  // CATV2-002 checks
  const qNajirBn = searchCatalogue('নাজিরশাইল চাল');
  assert.equal(qNajirBn.length, 1);
  assert.equal(qNajirBn[0].code, 'CATV2-002');

  const qNajirEn = searchCatalogue('Najirshail Rice');
  assert.equal(qNajirEn.length, 1);
  assert.equal(qNajirEn[0].code, 'CATV2-002');

  const qNajirBg = searchCatalogue('Najirshail Chal');
  assert.equal(qNajirBg.length, 1);
  assert.equal(qNajirBg[0].code, 'CATV2-002');

  // Soybean oil checks - must return CATV2-039 and CATV2-040, never CATV2-001 or CATV2-002
  const qOilBn = searchCatalogue('সয়াবিন তেল');
  assert.equal(qOilBn.length, 2);
  const oilCodesBn = qOilBn.map((x) => x.code);
  assert.ok(oilCodesBn.includes('CATV2-039'));
  assert.ok(oilCodesBn.includes('CATV2-040'));
  assert.ok(!oilCodesBn.includes('CATV2-001'));
  assert.ok(!oilCodesBn.includes('CATV2-002'));

  const qOilEn = searchCatalogue('Soybean Oil');
  assert.equal(qOilEn.length, 2);
  const oilCodesEn = qOilEn.map((x) => x.code);
  assert.ok(oilCodesEn.includes('CATV2-039'));
  assert.ok(oilCodesEn.includes('CATV2-040'));
  assert.ok(!oilCodesEn.includes('CATV2-001'));
  assert.ok(!oilCodesEn.includes('CATV2-002'));
});
