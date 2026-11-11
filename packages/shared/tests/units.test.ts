import test from 'node:test';
import assert from 'node:assert/strict';
import {
  convertToBaseQuantity,
  resolveConversionFactor,
  calculateLineTotal,
  getAvailableUnitsForBase,
} from '../src/units.ts';

test('Resolves standard mass conversions to কেজি', () => {
  assert.equal(resolveConversionFactor('কেজি', 'কেজি'), 1);
  assert.equal(resolveConversionFactor('১ কেজি', 'কেজি'), 1);
  assert.equal(resolveConversionFactor('৫০০ গ্রাম', 'কেজি'), 0.5);
  assert.equal(resolveConversionFactor('হাফ কেজি', 'কেজি'), 0.5);
  assert.equal(resolveConversionFactor('হাফ কেজি (৫০০ গ্রাম)', 'কেজি'), 0.5);
  assert.equal(resolveConversionFactor('গ্রাম', 'কেজি'), 0.001);
  assert.equal(resolveConversionFactor('২৫ কেজির বস্তা', 'কেজি'), 25);
  assert.equal(resolveConversionFactor('৫০ কেজির বস্তা', 'কেজি'), 50);
  assert.equal(resolveConversionFactor('মন', 'কেজি'), 40);
  assert.equal(resolveConversionFactor('মণ', 'কেজি'), 40);
});

test('Product-specific sack and packet conversions', () => {
  const riceCustom = { বস্তা: 50, প্যাকেট: 5 };
  assert.equal(resolveConversionFactor('বস্তা', 'কেজি', riceCustom), 50);
  assert.equal(resolveConversionFactor('প্যাকেট', 'কেজি', riceCustom), 5);

  const dalCustom = { বস্তা: 25, প্যাকেট: 1 };
  assert.equal(resolveConversionFactor('বস্তা', 'কেজি', dalCustom), 25);
  assert.equal(resolveConversionFactor('প্যাকেট', 'কেজি', dalCustom), 1);
});

test('Missing conversion returns null and descriptive error', () => {
  assert.equal(resolveConversionFactor('অজানা_একক', 'কেজি'), null);

  const conversion = convertToBaseQuantity('5', 'অজানা_একক', 'কেজি');
  assert.equal(conversion.baseQuantity, null);
  assert.ok(conversion.error.includes('রূপান্তর মান নির্ধারিত নেই'));
});

test('Valid conversion calculates base quantity accurately', () => {
  // 2 sacks of 25kg = 50 kg
  const c1 = convertToBaseQuantity('2', '২৫ কেজির বস্তা', 'কেজি');
  assert.equal(c1.baseQuantity, 50);
  assert.equal(c1.error, null);

  // 3 half-kg packets = 1.5 kg
  const c2 = convertToBaseQuantity('3', '৫০০ গ্রাম', 'কেজি');
  assert.equal(c2.baseQuantity, 1.5);
  assert.equal(c2.error, null);

  // 2 dozen = 24 pcs
  const c3 = convertToBaseQuantity('2', 'ডজন', 'পিস');
  assert.equal(c3.baseQuantity, 24);
  assert.equal(c3.error, null);
});

test('Rejects non-positive or malformed quantities', () => {
  assert.equal(convertToBaseQuantity('0', 'কেজি', 'কেজি').baseQuantity, null);
  assert.equal(convertToBaseQuantity('-5', 'কেজি', 'কেজি').baseQuantity, null);
  assert.equal(convertToBaseQuantity('abc', 'কেজি', 'কেজি').baseQuantity, null);
});

test('calculateLineTotal rounds exact cents', () => {
  assert.equal(calculateLineTotal('2', '1500'), 3000);
  assert.equal(calculateLineTotal('1.5', '65.50'), 98.25);
  assert.equal(calculateLineTotal('3', '33.333'), 100);
});

test('getAvailableUnitsForBase excludes ২৫০ গ্রাম by default', () => {
  const units = getAvailableUnitsForBase('কেজি');
  const unitNames = units.map((u) => u.name);
  assert.ok(unitNames.includes('কেজি'));
  assert.ok(unitNames.includes('৫০০ গ্রাম'));
  assert.ok(!unitNames.includes('২৫০ গ্রাম'));
});
