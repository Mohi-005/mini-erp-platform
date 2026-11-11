import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeBdMobile,
  isBdMobile,
  areBdMobilesEqual,
} from '../src/phone.ts';

test('Bangladesh mobile normalization: local 11-digit format', () => {
  assert.equal(normalizeBdMobile('01712345678'), '01712345678');
  assert.equal(normalizeBdMobile('1712345678'), '01712345678');
  assert.equal(normalizeBdMobile('01812345678'), '01812345678');
  assert.equal(normalizeBdMobile('01912345678'), '01912345678');
  assert.equal(normalizeBdMobile('01512345678'), '01512345678');
  assert.equal(normalizeBdMobile('01612345678'), '01612345678');
  assert.equal(normalizeBdMobile('01312345678'), '01312345678');
  assert.equal(normalizeBdMobile('01412345678'), '01412345678');
  assert.equal(isBdMobile('01712345678'), true);
});

test('Bangladesh mobile normalization: international formats (+880, 880, 00880)', () => {
  assert.equal(normalizeBdMobile('+8801712345678'), '01712345678');
  assert.equal(normalizeBdMobile('8801712345678'), '01712345678');
  assert.equal(normalizeBdMobile('008801712345678'), '01712345678');
});

test('Bangladesh mobile normalization: spaces, hyphens, and parentheses', () => {
  assert.equal(normalizeBdMobile('01712-345678'), '01712345678');
  assert.equal(normalizeBdMobile('01712 345678'), '01712345678');
  assert.equal(normalizeBdMobile('(+880) 1712-345678'), '01712345678');
  assert.equal(normalizeBdMobile('+880 (171) 234-5678'), '01712345678');
  assert.equal(normalizeBdMobile('  01712-345678  '), '01712345678');
});

test('Bangladesh mobile normalization: Bengali numerals', () => {
  assert.equal(normalizeBdMobile('০১৭১২৩৪৫৬৭৮'), '01712345678');
  assert.equal(normalizeBdMobile('+৮৮০০১৭১২৩৪৫৬৭৮'), '01712345678');
  assert.equal(normalizeBdMobile('৮৮০১৭১২-৩৪৫৬৭৮'), '01712345678');
  assert.equal(normalizeBdMobile('(+৮৮০) ০১৭১২-৩৪৫৬৭৮'), '01712345678');
});

test('Bangladesh mobile normalization: empty and whitespace input', () => {
  assert.equal(normalizeBdMobile(''), null);
  assert.equal(normalizeBdMobile('   '), null);
  assert.equal(normalizeBdMobile(null), null);
  assert.equal(normalizeBdMobile(undefined), null);
  assert.equal(isBdMobile(''), false);
});

test('Bangladesh mobile normalization: invalid input and non-BD numbers', () => {
  assert.equal(normalizeBdMobile('12345'), null);
  assert.equal(normalizeBdMobile('017123'), null);
  assert.equal(normalizeBdMobile('0171234567890'), null); // too long
  assert.equal(normalizeBdMobile('01212345678'), null); // invalid operator 012
  assert.equal(normalizeBdMobile('01012345678'), null); // invalid operator 010
  assert.equal(normalizeBdMobile('abc01712345678'), null); // contains letters
  assert.equal(normalizeBdMobile('+14155552671'), null); // US number
  assert.equal(normalizeBdMobile('+919876543210'), null); // Indian number
});

test('Bangladesh mobile normalization: equivalent representations match', () => {
  const reps = [
    '01712345678',
    '+8801712345678',
    '8801712345678',
    '008801712345678',
    '01712-345678',
    '01712 345678',
    '(+880) 1712-345678',
    '০১৭১২৩৪৫৬৭৮',
    '+৮৮০১৭১২-৩৪৫৬৭৮',
  ];

  for (let i = 0; i < reps.length; i++) {
    for (let j = 0; j < reps.length; j++) {
      assert.equal(
        areBdMobilesEqual(reps[i], reps[j]),
        true,
        `Expected ${reps[i]} and ${reps[j]} to be recognized as equal`,
      );
    }
  }
});

test('Bangladesh mobile normalization: similar-looking different numbers never match', () => {
  // Different operator
  assert.equal(areBdMobilesEqual('01712345678', '01812345678'), false);
  // Different last digit
  assert.equal(areBdMobilesEqual('01712345678', '01712345679'), false);
  // Different middle digit
  assert.equal(areBdMobilesEqual('01712345678', '01713345678'), false);
  // Suffix/substring match rejected
  assert.equal(normalizeBdMobile('345678'), null);
});
