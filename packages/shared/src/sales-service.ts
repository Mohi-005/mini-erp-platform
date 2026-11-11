import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Json } from './database.types.ts';

export interface PostSaleItem {
  product_id: string;
  quantity: number | string;
  unit_price: number | string;
  unit_name?: string | null;
  base_quantity?: number | string;
}

export interface PostSaleInput {
  business_id: string;
  customer_id?: string | null;
  customer_phone?: string | null;
  lines: PostSaleItem[];
  paid_amount: number | string;
  payment_method?: 'CASH' | 'BKASH' | 'NAGAD' | 'BANK' | null;
  operation_id: string;
  occurred_at?: string;
}

export interface PostSaleResult {
  id: string;
  invoice_no: string;
  total_amount?: number;
  duplicate: boolean;
}

/**
 * Normalizes an optional customer phone snapshot:
 * - undefined, null, or whitespace-only strings resolve to null.
 * - Non-empty strings are trimmed.
 */
export function normalizePhoneSnapshot(phone?: string | null): string | null {
  if (!phone) return null;
  const trimmed = phone.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Shared service helper for posting sales via the post_sale RPC.
 * Backward-compatible with callers omitting customer_phone.
 */
export async function postSale(
  client: SupabaseClient<Database>,
  input: PostSaleInput,
): Promise<PostSaleResult> {
  const cleanPhone = normalizePhoneSnapshot(input.customer_phone);

  const rpcPayload: Database['public']['Functions']['post_sale']['Args'] = {
    p_business_id: input.business_id,
    p_customer_id: input.customer_id || null,
    p_lines: input.lines as unknown as Json,
    p_paid_amount: input.paid_amount,
    p_payment_method:
      Number(input.paid_amount) > 0 ? (input.payment_method ?? null) : null,
    p_operation_id: input.operation_id,
    p_occurred_at: input.occurred_at ?? new Date().toISOString(),
    ...(cleanPhone !== null ? { p_customer_phone: cleanPhone } : {}),
  };

  const { data, error } = await client.rpc('post_sale', rpcPayload);
  if (error) {
    throw error;
  }
  return data as unknown as PostSaleResult;
}
