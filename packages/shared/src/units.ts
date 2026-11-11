/**
 * Shared Wholesale & Retail Unit Master and Conversion Engine
 * Phase 1: Canonical Unit definitions and exact conversion calculations.
 */

export type BaseUnitType = 'mass' | 'volume' | 'count' | 'length';

export type BaseUnit = 'কেজি' | 'লিটার' | 'পিস' | 'মিটার';

export interface UnitDefinition {
  name_bn: string;
  name_en: string;
  type: BaseUnitType;
  base_unit: BaseUnit;
  default_factor?: number; // Factor to multiply by to get base_unit (if constant across products)
  is_wholesale?: boolean;
}

export const CANONICAL_UNITS: Record<string, UnitDefinition> = {
  // Mass / Weight Units (Base: কেজি)
  কেজি: {
    name_bn: 'কেজি',
    name_en: 'Kilogram (kg)',
    type: 'mass',
    base_unit: 'কেজি',
    default_factor: 1,
  },
  '১ কেজি': {
    name_bn: '১ কেজি',
    name_en: '1 Kilogram',
    type: 'mass',
    base_unit: 'কেজি',
    default_factor: 1,
  },
  '৫০০ গ্রাম': {
    name_bn: '৫০০ গ্রাম',
    name_en: '500 Gram (Half kg)',
    type: 'mass',
    base_unit: 'কেজি',
    default_factor: 0.5,
  },
  'হাফ কেজি': {
    name_bn: 'হাফ কেজি',
    name_en: 'Half kg',
    type: 'mass',
    base_unit: 'কেজি',
    default_factor: 0.5,
  },
  'হাফ কেজি (৫০০ গ্রাম)': {
    name_bn: 'হাফ কেজি (৫০০ গ্রাম)',
    name_en: 'Half kg (500g)',
    type: 'mass',
    base_unit: 'কেজি',
    default_factor: 0.5,
  },
  গ্রাম: {
    name_bn: 'গ্রাম',
    name_en: 'Gram (g)',
    type: 'mass',
    base_unit: 'কেজি',
    default_factor: 0.001,
  },
  '২৫ কেজির বস্তা': {
    name_bn: '২৫ কেজির বস্তা',
    name_en: '25kg Sack',
    type: 'mass',
    base_unit: 'কেজি',
    default_factor: 25,
    is_wholesale: true,
  },
  '৫০ কেজির বস্তা': {
    name_bn: '৫০ কেজির বস্তা',
    name_en: '50kg Sack',
    type: 'mass',
    base_unit: 'কেজি',
    default_factor: 50,
    is_wholesale: true,
  },
  মন: {
    name_bn: 'মন',
    name_en: 'Maund (40kg)',
    type: 'mass',
    base_unit: 'কেজি',
    default_factor: 40,
    is_wholesale: true,
  },
  মণ: {
    name_bn: 'মণ',
    name_en: 'Maund (40kg)',
    type: 'mass',
    base_unit: 'কেজি',
    default_factor: 40,
    is_wholesale: true,
  },

  // Volume Units (Base: লিটার)
  লিটার: {
    name_bn: 'লিটার',
    name_en: 'Litre (L)',
    type: 'volume',
    base_unit: 'লিটার',
    default_factor: 1,
  },
  মিলিলিটার: {
    name_bn: 'মিলিলিটার',
    name_en: 'Millilitre (ml)',
    type: 'volume',
    base_unit: 'লিটার',
    default_factor: 0.001,
  },
  বোতল: {
    name_bn: 'বোতল',
    name_en: 'Bottle',
    type: 'volume',
    base_unit: 'লিটার',
  },
  জার: { name_bn: 'জার', name_en: 'Jar', type: 'volume', base_unit: 'লিটার' },
  ক্যান: {
    name_bn: 'ক্যান',
    name_en: 'Can',
    type: 'volume',
    base_unit: 'লিটার',
  },
  ড্রাম: {
    name_bn: 'ড্রাম',
    name_en: 'Drum',
    type: 'volume',
    base_unit: 'লিটার',
    is_wholesale: true,
  },

  // Countable Units (Base: পিস)
  পিস: {
    name_bn: 'পিস',
    name_en: 'Piece (pcs)',
    type: 'count',
    base_unit: 'পিস',
    default_factor: 1,
  },
  জোড়া: {
    name_bn: 'জোড়া',
    name_en: 'Pair',
    type: 'count',
    base_unit: 'পিস',
    default_factor: 2,
  },
  ডজন: {
    name_bn: 'ডজন',
    name_en: 'Dozen',
    type: 'count',
    base_unit: 'পিস',
    default_factor: 12,
  },
  সেট: {
    name_bn: 'সেট',
    name_en: 'Set',
    type: 'count',
    base_unit: 'পিস',
    default_factor: 1,
  },
  প্যাকেট: {
    name_bn: 'প্যাকেট',
    name_en: 'Packet',
    type: 'count',
    base_unit: 'পিস',
  },
  কার্টন: {
    name_bn: 'কার্টন',
    name_en: 'Carton',
    type: 'count',
    base_unit: 'পিস',
    is_wholesale: true,
  },
  বাক্স: {
    name_bn: 'বাক্স',
    name_en: 'Box',
    type: 'count',
    base_unit: 'পিস',
    is_wholesale: true,
  },
  ব্যাগ: { name_bn: 'ব্যাগ', name_en: 'Bag', type: 'count', base_unit: 'পিস' },
  প্যাক: { name_bn: 'প্যাক', name_en: 'Pack', type: 'count', base_unit: 'পিস' },
  বান্ডিল: {
    name_bn: 'বান্ডিল',
    name_en: 'Bundle',
    type: 'count',
    base_unit: 'পিস',
    is_wholesale: true,
  },
  রোল: { name_bn: 'রোল', name_en: 'Roll', type: 'count', base_unit: 'পিস' },
  কৌটা: {
    name_bn: 'কৌটা',
    name_en: 'Canister / Pot',
    type: 'count',
    base_unit: 'পিস',
  },
  টিন: { name_bn: 'টিন', name_en: 'Tin', type: 'count', base_unit: 'পিস' },
  টিউব: { name_bn: 'টিউব', name_en: 'Tube', type: 'count', base_unit: 'পিস' },
  শিট: { name_bn: 'শিট', name_en: 'Sheet', type: 'count', base_unit: 'পিস' },

  // Generic Packaging
  বস্তা: {
    name_bn: 'বস্তা',
    name_en: 'Sack',
    type: 'mass',
    base_unit: 'কেজি',
    is_wholesale: true,
  },

  // Length Units (Base: মিটার)
  মিটার: {
    name_bn: 'মিটার',
    name_en: 'Metre (m)',
    type: 'length',
    base_unit: 'মিটার',
    default_factor: 1,
  },
  ফুট: {
    name_bn: 'ফুট',
    name_en: 'Foot (ft)',
    type: 'length',
    base_unit: 'মিটার',
    default_factor: 0.3048,
  },
};

export type ProductUnitConversions = Record<string, number>;

/**
 * Returns available units for a given base unit, with default and product-specific factors.
 */
export function getAvailableUnitsForBase(
  baseUnit: BaseUnit,
  customConversions?: ProductUnitConversions | null,
): { name: string; factor: number; label: string }[] {
  const result: { name: string; factor: number; label: string }[] = [];

  for (const [name, def] of Object.entries(CANONICAL_UNITS)) {
    if (def.base_unit !== baseUnit && !customConversions?.[name]) {
      continue;
    }
    const factor = customConversions?.[name] ?? def.default_factor;
    if (typeof factor === 'number' && factor > 0) {
      result.push({
        name,
        factor,
        label: factor === 1 ? name : `${name} (${factor} ${baseUnit})`,
      });
    }
  }

  // Include any extra custom conversions configured for this product
  if (customConversions) {
    for (const [name, factor] of Object.entries(customConversions)) {
      if (
        typeof factor === 'number' &&
        factor > 0 &&
        !result.some((r) => r.name === name)
      ) {
        result.push({
          name,
          factor,
          label: `${name} (${factor} ${baseUnit})`,
        });
      }
    }
  }

  return result;
}

/**
 * Resolves the conversion factor from a selected unit to the product's base unit.
 * Throws or returns null if no valid conversion is configured.
 */
export function resolveConversionFactor(
  selectedUnit: string,
  baseUnit: BaseUnit,
  customConversions?: ProductUnitConversions | null,
): number | null {
  const trimmed = selectedUnit.trim();
  if (trimmed === baseUnit) return 1;

  if (customConversions && typeof customConversions[trimmed] === 'number') {
    const factor = customConversions[trimmed];
    return factor > 0 ? factor : null;
  }

  const def = CANONICAL_UNITS[trimmed];
  if (
    def &&
    def.base_unit === baseUnit &&
    typeof def.default_factor === 'number'
  ) {
    return def.default_factor > 0 ? def.default_factor : null;
  }

  return null;
}

/**
 * Converts a quantity from a selected unit into the product's base inventory quantity.
 * If conversion factor is missing, returns null with error field.
 */
export function convertToBaseQuantity(
  quantity: string | number,
  selectedUnit: string,
  baseUnit: BaseUnit,
  customConversions?: ProductUnitConversions | null,
):
  | { baseQuantity: number; error: null }
  | { baseQuantity: null; error: string } {
  const qty = Number(quantity);
  if (!Number.isFinite(qty) || qty <= 0) {
    return { baseQuantity: null, error: 'invalid_quantity' };
  }

  const factor = resolveConversionFactor(
    selectedUnit,
    baseUnit,
    customConversions,
  );
  if (factor === null || factor <= 0) {
    return {
      baseQuantity: null,
      error: `পণ্যটির জন্য '${selectedUnit}' থেকে '${baseUnit}' এর রূপান্তর মান নির্ধারিত নেই।`,
    };
  }

  const baseQty = Number((qty * factor).toFixed(6));
  return { baseQuantity: baseQty, error: null };
}

/**
 * Calculates line total = quantity * unit_price with 2 decimal exact rounding.
 */
export function calculateLineTotal(
  quantity: string | number,
  unitPrice: string | number,
): number {
  const q = Number(quantity) || 0;
  const p = Number(unitPrice) || 0;
  return Math.round(q * p * 100) / 100;
}
