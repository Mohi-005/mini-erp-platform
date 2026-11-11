import assert from 'node:assert/strict';
import test from 'node:test';

import {
  compareDecimalStrings,
  multiplyDecimalStrings,
  sumDecimalStrings,
  validateSalesLineDraft,
} from '../src/sales.ts';
import {
  normalizePhoneSnapshot,
  postSale,
  type PostSaleInput,
} from '../src/sales-service.ts';

const productId = '71000000-0000-4000-8000-000000000001';

test('sales draft validates product and positive quantity without Number conversion', () => {
  const result = validateSalesLineDraft({
    product_id: productId,
    quantity: '০১.২৫০',
    unit_price: '১২.৪০',
  });

  assert.equal(result.valid, true);
  if (result.valid) {
    assert.equal(result.value.quantity, '1.250');
    assert.equal(result.value.unit_price, '12.40');
  }
});

test('sales draft rejects invalid product IDs, zero quantity, exponent and negative values', () => {
  const badId = validateSalesLineDraft({
    product_id: 'bad-id',
    quantity: '1',
    unit_price: '10',
  });
  assert.equal(badId.valid, false);
  if (!badId.valid) assert.equal(badId.errors.product_id, 'invalid_uuid');

  for (const quantity of ['0', '0.000', '-1', '1e2', 'NaN', 'Infinity']) {
    const invalid = validateSalesLineDraft({
      product_id: productId,
      quantity,
      unit_price: '10',
    });
    assert.equal(invalid.valid, false, `expected ${quantity} to be rejected`);
  }
});

test('sales draft rejects invalid unit price', () => {
  for (const unit_price of ['-1', '1e3', 'NaN', '']) {
    const result = validateSalesLineDraft({
      product_id: productId,
      quantity: '1',
      unit_price,
    });
    assert.equal(result.valid, false, `expected ${unit_price} to be rejected`);
  }
});

test('decimal multiplication is exact and does not apply final currency rounding', () => {
  assert.equal(multiplyDecimalStrings('0.1', '0.2'), '0.02');
  assert.equal(multiplyDecimalStrings('1.250', '12.40'), '15.5');
  assert.equal(multiplyDecimalStrings('2.00', '10'), '20');
});

test('decimal sums are exact for mixed scales', () => {
  assert.equal(sumDecimalStrings(['0.1', '0.02', '1.880']), '2');
  assert.equal(sumDecimalStrings([]), '0');
  assert.equal(sumDecimalStrings(['1.25', 'invalid']), null);
});

test('stock comparison uses decimal-string ordering, not binary floating point', () => {
  assert.equal(compareDecimalStrings('1.2', '1.11'), 1);
  assert.equal(compareDecimalStrings('1.200', '1.2'), 0);
  assert.equal(compareDecimalStrings('0.09', '0.1'), -1);
  assert.equal(compareDecimalStrings('NaN', '1'), null);
});

test('normalizePhoneSnapshot handles null, undefined, empty and whitespace', () => {
  assert.equal(normalizePhoneSnapshot(undefined), null);
  assert.equal(normalizePhoneSnapshot(null), null);
  assert.equal(normalizePhoneSnapshot(''), null);
  assert.equal(normalizePhoneSnapshot('   '), null);
  assert.equal(normalizePhoneSnapshot('01712345678'), '01712345678');
  assert.equal(normalizePhoneSnapshot('  01712345678  '), '01712345678');
});

test('postSale forwards phone when provided and omits when null/whitespace', async () => {
  let capturedPayload: Record<string, unknown> | null = null;
  const mockClient = {
    rpc: async (fn: string, payload: Record<string, unknown>) => {
      assert.equal(fn, 'post_sale');
      capturedPayload = payload;
      return {
        data: {
          id: 'test-doc-id',
          invoice_no: 'S-20261108-TEST',
          duplicate: false,
        },
        error: null,
      };
    },
  } as unknown as Parameters<typeof postSale>[0];

  // Case 1: with phone
  const inputWithPhone: PostSaleInput = {
    business_id: 'biz-1',
    lines: [{ product_id: productId, quantity: 1, unit_price: 10 }],
    paid_amount: 10,
    payment_method: 'CASH',
    operation_id: 'op-1',
    customer_phone: '01812345678',
  };
  const res1 = await postSale(mockClient, inputWithPhone);
  assert.equal(res1.invoice_no, 'S-20261108-TEST');
  assert.equal(capturedPayload!['p_customer_phone'], '01812345678');

  // Case 2: without phone (undefined)
  const inputWithoutPhone: PostSaleInput = {
    business_id: 'biz-1',
    lines: [{ product_id: productId, quantity: 1, unit_price: 10 }],
    paid_amount: 10,
    payment_method: 'CASH',
    operation_id: 'op-2',
  };
  const res2 = await postSale(mockClient, inputWithoutPhone);
  assert.equal(res2.invoice_no, 'S-20261108-TEST');
  assert.equal(capturedPayload!['p_customer_phone'], undefined);

  // Case 3: whitespace phone
  const inputWithWhitespace: PostSaleInput = {
    business_id: 'biz-1',
    lines: [{ product_id: productId, quantity: 1, unit_price: 10 }],
    paid_amount: 10,
    payment_method: 'CASH',
    operation_id: 'op-3',
    customer_phone: '   ',
  };
  const res3 = await postSale(mockClient, inputWithWhitespace);
  assert.equal(res3.invoice_no, 'S-20261108-TEST');
  assert.equal(capturedPayload!['p_customer_phone'], undefined);
});
