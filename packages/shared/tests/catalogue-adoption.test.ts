import test from 'node:test';
import assert from 'node:assert/strict';
import {
  adoptCatalogueProduct,
  ensureTenantUnit,
  ensureTenantCategory,
} from '../src/catalogue-service.ts';
import { CANONICAL_283_CATALOGUE } from '../src/catalogue.ts';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../src/database.types.ts';

test('adoptCatalogueProduct: unarchives archived product when adopted', async () => {
  const fakeProducts: Array<{
    id: string;
    business_id: string;
    name_bn: string;
    sku: string;
    archived_at: string | null;
    unit_id: string;
    category_id: string;
  }> = [
    {
      id: 'prod-01',
      business_id: 'biz-1',
      name_bn: 'সরিষার তেল (লিটার)',
      sku: 'SKU-CATV2-042',
      archived_at: '2026-11-09T00:00:00Z',
      unit_id: 'unit-01',
      category_id: 'cat-01',
    },
  ];

  let unarchivedId: string | null = null;

  const mockClient = {
    from: (table: string) => {
      if (table === 'products') {
        return {
          select: () => ({
            eq: (_col1: string, val1: string) => ({
              eq: (_col2: string, val2: string) => ({
                maybeSingle: async () => {
                  const found = fakeProducts.find(
                    (p) =>
                      p.business_id === val1 &&
                      (p.sku === val2 || p.name_bn === val2),
                  );
                  return { data: found ?? null, error: null };
                },
              }),
            }),
          }),
          update: (fields: { archived_at: string | null }) => ({
            eq: (_idCol: string, idVal: string) => ({
              select: () => ({
                single: async () => {
                  unarchivedId = idVal;
                  const item = fakeProducts.find((p) => p.id === idVal);
                  if (item) {
                    item.archived_at = fields.archived_at;
                  }
                  return { data: item, error: null };
                },
              }),
            }),
          }),
        };
      }
      return {};
    },
  } as unknown as SupabaseClient<Database>;

  const catalogueItem = CANONICAL_283_CATALOGUE.find(
    (c) => c.sku === 'SKU-CATV2-042',
  )!;
  assert.ok(catalogueItem);
  assert.equal(catalogueItem.name_bn, 'সরিষার তেল (লিটার)');

  const result = await adoptCatalogueProduct(
    mockClient,
    'biz-1',
    catalogueItem,
  );

  assert.ok(result);
  assert.equal(result.id, 'prod-01');
  assert.equal(result.archived_at, null);
  assert.equal(unarchivedId, 'prod-01');
});

test('adoptCatalogueProduct: adopts product with parentheses in name without .or() parsing errors', async () => {
  const catalogueWithParens = CANONICAL_283_CATALOGUE.filter((c) =>
    c.name_bn.includes('('),
  );
  assert.ok(catalogueWithParens.length >= 10);

  const createdProducts: Record<string, unknown>[] = [];
  const createdUnits: Record<string, unknown>[] = [];
  const createdCategories: Record<string, unknown>[] = [];

  const mockClient = {
    from: (table: string) => {
      if (table === 'products') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: async () => ({ data: null, error: null }),
              }),
            }),
          }),
          insert: (record: Record<string, unknown>) => ({
            select: () => ({
              single: async () => {
                const inserted = {
                  id: `prod-${createdProducts.length + 1}`,
                  ...record,
                  archived_at: null,
                };
                createdProducts.push(inserted);
                return { data: inserted, error: null };
              },
            }),
          }),
        };
      }
      if (table === 'product_units') {
        return {
          select: () => ({
            eq: () => ({
              eq: (_c: string, v2: string) => ({
                maybeSingle: async () => {
                  const existing = createdUnits.find((u) => u.name_bn === v2);
                  return { data: existing ?? null, error: null };
                },
              }),
            }),
          }),
          insert: (rec: Record<string, unknown>) => ({
            select: () => ({
              single: async () => {
                const inserted = {
                  id: `unit-${createdUnits.length + 1}`,
                  ...rec,
                  archived_at: null,
                };
                createdUnits.push(inserted);
                return { data: inserted, error: null };
              },
            }),
          }),
        };
      }
      if (table === 'product_categories') {
        return {
          select: () => ({
            eq: () => ({
              eq: (_c: string, v2: string) => ({
                maybeSingle: async () => {
                  const existing = createdCategories.find(
                    (c) => c.name_bn === v2,
                  );
                  return { data: existing ?? null, error: null };
                },
              }),
            }),
          }),
          insert: (rec: Record<string, unknown>) => ({
            select: () => ({
              single: async () => {
                const inserted = {
                  id: `cat-${createdCategories.length + 1}`,
                  ...rec,
                  archived_at: null,
                };
                createdCategories.push(inserted);
                return { data: inserted, error: null };
              },
            }),
          }),
        };
      }
      return {};
    },
  } as unknown as SupabaseClient<Database>;

  for (const item of catalogueWithParens) {
    const adopted = await adoptCatalogueProduct(mockClient, 'biz-test', item);
    assert.ok(adopted);
    assert.equal(adopted.name_bn, item.name_bn);
    assert.equal(adopted.sku, item.sku);
  }

  assert.equal(createdProducts.length, catalogueWithParens.length);
});

test('ensureTenantUnit and ensureTenantCategory: restores archived records', async () => {
  let unitRestored = false;
  let catRestored = false;

  const mockClient = {
    from: (table: string) => {
      if (table === 'product_units') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: {
                    id: 'u1',
                    name_bn: 'কেজি',
                    archived_at: '2026-11-01',
                  },
                  error: null,
                }),
              }),
            }),
          }),
          update: () => ({
            eq: () => {
              unitRestored = true;
              return { data: null, error: null };
            },
          }),
        };
      }
      if (table === 'product_categories') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: {
                    id: 'c1',
                    name_bn: 'চাল',
                    archived_at: '2026-11-01',
                  },
                  error: null,
                }),
              }),
            }),
          }),
          update: () => ({
            eq: () => {
              catRestored = true;
              return { data: null, error: null };
            },
          }),
        };
      }
      return {};
    },
  } as unknown as SupabaseClient<Database>;

  const unit = await ensureTenantUnit(mockClient, 'biz-1', 'কেজি');
  assert.ok(unit);
  assert.equal(unitRestored, true);
  assert.equal(unit.archived_at, null);

  const cat = await ensureTenantCategory(mockClient, 'biz-1', 'চাল');
  assert.ok(cat);
  assert.equal(catRestored, true);
  assert.equal(cat.archived_at, null);
});
