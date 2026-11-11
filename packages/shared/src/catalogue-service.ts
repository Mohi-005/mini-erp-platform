/**
 * Central Catalogue & Tenant Product Adoption Service
 * Phase 1: Search, query and seamlessly adopt canonical 283 catalogue items into tenant inventory.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Database,
  Product,
  ProductCategory,
  ProductUnit,
} from './database.types.ts';
import {
  CANONICAL_283_CATALOGUE,
  searchCatalogue,
  type CatalogueProduct,
} from './catalogue.ts';
import type { BaseUnit } from './units.ts';

export { CANONICAL_283_CATALOGUE, searchCatalogue, type CatalogueProduct };

/**
 * Ensures a standard unit exists for this business.
 */
export async function ensureTenantUnit(
  client: SupabaseClient<Database>,
  businessId: string,
  baseUnit: BaseUnit,
): Promise<ProductUnit | null> {
  // Check if tenant already has this unit
  const { data: existing, error: fetchErr } = await client
    .from('product_units')
    .select('*')
    .eq('business_id', businessId)
    .eq('name_bn', baseUnit)
    .maybeSingle();

  if (fetchErr) {
    console.error('Failed to query tenant unit:', fetchErr);
  }
  if (existing) {
    if (existing.archived_at !== null) {
      await client
        .from('product_units')
        .update({ archived_at: null })
        .eq('id', existing.id);
      (existing as ProductUnit).archived_at = null;
    }
    return existing as ProductUnit;
  }

  // Insert unit for tenant
  const { data: inserted, error: insertErr } = await client
    .from('product_units')
    .insert({
      business_id: businessId,
      name_bn: baseUnit,
      name_en: baseUnit === 'কেজি' ? 'kg' : baseUnit === 'লিটার' ? 'L' : 'pcs',
    })
    .select('*')
    .single();

  if (insertErr) {
    // In case of concurrent race, retry query
    const { data: retry } = await client
      .from('product_units')
      .select('*')
      .eq('business_id', businessId)
      .eq('name_bn', baseUnit)
      .maybeSingle();
    return (retry as ProductUnit) ?? null;
  }

  return inserted as ProductUnit;
}

/**
 * Ensures a category exists for this business.
 */
export async function ensureTenantCategory(
  client: SupabaseClient<Database>,
  businessId: string,
  categoryNameBn: string,
): Promise<ProductCategory | null> {
  const { data: existing } = await client
    .from('product_categories')
    .select('*')
    .eq('business_id', businessId)
    .eq('name_bn', categoryNameBn)
    .maybeSingle();

  if (existing) {
    if (existing.archived_at !== null) {
      await client
        .from('product_categories')
        .update({ archived_at: null })
        .eq('id', existing.id);
      (existing as ProductCategory).archived_at = null;
    }
    return existing as ProductCategory;
  }

  const { data: inserted, error } = await client
    .from('product_categories')
    .insert({
      business_id: businessId,
      name_bn: categoryNameBn,
    })
    .select('*')
    .single();

  if (error) {
    const { data: retry } = await client
      .from('product_categories')
      .select('*')
      .eq('business_id', businessId)
      .eq('name_bn', categoryNameBn)
      .maybeSingle();
    return (retry as ProductCategory) ?? null;
  }

  return inserted as ProductCategory;
}

/**
 * Adopts a catalogue product into the tenant's product inventory.
 * If the product is already adopted by this business, returns the existing product record.
 */
export async function adoptCatalogueProduct(
  client: SupabaseClient<Database>,
  businessId: string,
  catalogueItem: CatalogueProduct,
): Promise<Product | null> {
  // 1. Check if already exists in tenant's products (first by SKU, then by Bengali name)
  let existing: Product | null = null;
  if (catalogueItem.sku) {
    const { data: bySku } = await client
      .from('products')
      .select('*')
      .eq('business_id', businessId)
      .eq('sku', catalogueItem.sku)
      .maybeSingle();
    if (bySku) {
      existing = bySku as Product;
    }
  }

  if (!existing && catalogueItem.name_bn) {
    const { data: byName } = await client
      .from('products')
      .select('*')
      .eq('business_id', businessId)
      .eq('name_bn', catalogueItem.name_bn)
      .maybeSingle();
    if (byName) {
      existing = byName as Product;
    }
  }

  if (existing) {
    // If product was previously archived, restore it into active catalogue
    if (existing.archived_at !== null) {
      const { data: unarchived, error: unarchiveError } = await client
        .from('products')
        .update({ archived_at: null })
        .eq('id', existing.id)
        .select('*')
        .single();
      if (!unarchiveError && unarchived) {
        return unarchived as Product;
      }
    }
    return existing;
  }

  // 2. Ensure base unit exists
  const unit = await ensureTenantUnit(
    client,
    businessId,
    catalogueItem.base_unit,
  );
  if (!unit) {
    throw new Error(
      `Failed to ensure unit '${catalogueItem.base_unit}' for business.`,
    );
  }

  // 3. Ensure category exists
  const category = await ensureTenantCategory(
    client,
    businessId,
    catalogueItem.category_bn,
  );

  // 4. Insert product
  const { data: inserted, error: insertError } = await client
    .from('products')
    .insert({
      business_id: businessId,
      name_bn: catalogueItem.name_bn,
      name_en: catalogueItem.name_en,
      name_banglish: catalogueItem.name_banglish,
      sku: catalogueItem.sku,
      unit_id: unit.id,
      category_id: category?.id ?? null,
      default_selling_price: '0',
      minimum_stock: null,
    })
    .select('*')
    .single();

  if (insertError) {
    // Check if inserted concurrently
    const { data: retry } = await client
      .from('products')
      .select('*')
      .eq('business_id', businessId)
      .eq('name_bn', catalogueItem.name_bn)
      .maybeSingle();
    if (retry) {
      const ret = retry as Product;
      if (ret.archived_at !== null) {
        const { data: unarchived } = await client
          .from('products')
          .update({ archived_at: null })
          .eq('id', ret.id)
          .select('*')
          .single();
        if (unarchived) return unarchived as Product;
      }
      return ret;
    }
    throw insertError;
  }

  return inserted as Product;
}
