-- ==============================================================================
-- Migration: 20261110000100_purchase_brand_note.sql
-- Description: Phase 9 - Purchase Optional Note / Brand Name Persistence
--              1. Add brand_note column to public.purchases_documents
--              2. Add check constraint (brand_note is null or length(btrim(brand_note)) between 1 and 200)
--              3. Grant select on brand_note to authenticated
--              4. Update public.post_purchase RPC to accept optional p_brand_note
--                 and drop 9-argument version to prevent PostgREST ambiguity
-- Target: mini erp dev (jujwnhwrktmimtcnljsd)
-- ==============================================================================

begin;

-- 1. Add nullable brand_note to public.purchases_documents
alter table public.purchases_documents
  add column if not exists brand_note text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.purchases_documents'::regclass
      and conname = 'purchases_documents_brand_note_check'
  ) then
    alter table public.purchases_documents
      add constraint purchases_documents_brand_note_check
      check (brand_note is null or length(btrim(brand_note)) between 1 and 200);
  end if;
end $$;

-- 2. Grant select on brand_note to authenticated
grant select (brand_note) on public.purchases_documents to authenticated;

-- 3. Replace post_purchase with 10-argument version and drop 9-argument version
drop function if exists public.post_purchase(uuid, uuid, jsonb, numeric, numeric, text, text, uuid, timestamptz);

create or replace function public.post_purchase(
  p_business_id uuid,
  p_supplier_id uuid,
  p_lines jsonb,
  p_other_cost_total numeric,
  p_paid_amount numeric,
  p_payment_method text,
  p_reference_no text,
  p_operation_id uuid,
  p_occurred_at timestamptz,
  p_brand_note text default null
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
  v_supplier public.suppliers%rowtype;
  v_item jsonb;
  v_product public.products%rowtype;
  v_unit public.product_units%rowtype;
  v_balance public.inventory_balances%rowtype;
  v_doc_id uuid;
  v_invoice text;
  v_clean_brand_note text := nullif(btrim(p_brand_note), '');
  v_fingerprint text := md5(
    (jsonb_build_object(
      'business_id', p_business_id,
      'supplier_id', p_supplier_id,
      'lines', p_lines,
      'other_cost_total', p_other_cost_total,
      'paid_amount', p_paid_amount,
      'payment_method', p_payment_method,
      'reference_no', p_reference_no,
      'occurred_at', p_occurred_at
    ) || case when v_clean_brand_note is not null
              then jsonb_build_object('brand_note', v_clean_brand_note)
              else '{}'::jsonb end
    )::text
  );
  v_existing_fingerprint text;
  v_subtotal numeric := 0;
  v_total numeric := 0;
  v_line_total numeric;
  v_qty numeric;
  v_cost numeric;
  v_alloc numeric;
  v_line_no integer := 0;
  v_last_alloc_line integer;
  v_remaining numeric;
  v_result record;
begin
  if v_actor is null then raise exception 'authentication_required' using errcode = '42501'; end if;
  if p_business_id is null or p_supplier_id is null or p_operation_id is null then raise exception 'required_argument_missing' using errcode = '22023'; end if;
  if p_occurred_at is null then raise exception 'occurred_at_required' using errcode = '22023'; end if;
  if not private.has_business_permission(p_business_id, 'purchases.create') then raise exception 'not_authorized' using errcode = '42501'; end if;
  if p_lines is null or jsonb_typeof(p_lines) <> 'array' or jsonb_array_length(p_lines) not between 1 and 100 then raise exception 'invalid_purchase_lines' using errcode = '22023'; end if;
  if p_other_cost_total is null or p_other_cost_total < 0 or p_other_cost_total >= 'Infinity'::numeric or p_other_cost_total <> round(p_other_cost_total, 2) then raise exception 'invalid_other_cost' using errcode = '22023'; end if;
  if p_paid_amount is null or p_paid_amount < 0 or p_paid_amount >= 'Infinity'::numeric or p_paid_amount <> round(p_paid_amount, 2) then raise exception 'invalid_paid_amount' using errcode = '22023'; end if;
  if p_payment_method is not null and p_payment_method not in ('CASH','BKASH','NAGAD','BANK') then raise exception 'invalid_payment_method' using errcode = '22023'; end if;
  if p_paid_amount > 0 and p_payment_method is null then raise exception 'payment_method_required' using errcode = '22023'; end if;
  if p_reference_no is not null and length(p_reference_no) > 100 then raise exception 'reference_too_long' using errcode = '22023'; end if;
  if v_clean_brand_note is not null and length(v_clean_brand_note) > 200 then raise exception 'brand_note_too_long' using errcode = '22023'; end if;

  perform pg_advisory_xact_lock(hashtextextended(p_business_id::text || p_operation_id::text, 0));
  select id, invoice_no, request_fingerprint into v_doc_id, v_invoice, v_existing_fingerprint from public.purchases_documents where business_id = p_business_id and operation_id = p_operation_id;
  if found then
    if v_existing_fingerprint <> v_fingerprint then raise exception 'operation_id_conflict' using errcode = '22023'; end if;
    -- A committed retry must return its first result even if the supplier was archived later.
    return jsonb_build_object('id', v_doc_id, 'invoice_no', v_invoice, 'duplicate', true);
  end if;

  select * into v_supplier from public.suppliers where business_id = p_business_id and id = p_supplier_id and archived_at is null for share;
  if not found then raise exception 'supplier_not_found_or_archived' using errcode = 'P0002'; end if;

  for v_result in
    select distinct (entry->>'product_id')::uuid as product_id
    from jsonb_array_elements(p_lines) as entry order by 1
  loop
    select * into v_product from public.products where business_id = p_business_id and id = v_result.product_id for share;
    if not found or v_product.archived_at is not null then raise exception 'product_not_found_or_archived' using errcode = 'P0002'; end if;
    perform 1 from public.inventory_balances where business_id = p_business_id and product_id = v_result.product_id for update;
  end loop;

  for v_item in select value from jsonb_array_elements(p_lines) loop
    v_qty := (v_item->>'quantity')::numeric;
    v_cost := (v_item->>'unit_cost')::numeric;
    if v_qty is null or v_qty <= 0 or v_qty >= 'Infinity'::numeric or v_cost is null or v_cost < 0 or v_cost >= 'Infinity'::numeric or v_cost <> round(v_cost, 2) then raise exception 'invalid_purchase_line' using errcode = '22023'; end if;
    v_subtotal := v_subtotal + round(v_qty * v_cost, 2);
  end loop;
  v_subtotal := round(v_subtotal, 2);
  if p_other_cost_total > 0 and v_subtotal = 0 then
    raise exception 'other_cost_allocation_requires_positive_subtotal' using errcode = '22023';
  end if;
  v_total := v_subtotal + p_other_cost_total;
  if v_total <= 0 then raise exception 'purchase_total_must_be_positive' using errcode = '22023'; end if;
  if p_paid_amount > v_total then raise exception 'paid_exceeds_total' using errcode = '22023'; end if;

  v_doc_id := gen_random_uuid();
  v_invoice := 'P-' || to_char(p_occurred_at at time zone 'Asia/Dhaka', 'YYYYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  insert into public.purchases_documents (id, business_id, invoice_no, operation_id, request_fingerprint, supplier_id,
    supplier_name_snapshot, reference_no, brand_note, subtotal_amount, other_cost_total, total_amount,
    paid_amount_at_purchase, payment_method, occurred_at, created_by)
  values (v_doc_id, p_business_id, v_invoice, p_operation_id, v_fingerprint, p_supplier_id, v_supplier.name,
    nullif(btrim(p_reference_no), ''), v_clean_brand_note, v_subtotal, p_other_cost_total, v_total, p_paid_amount,
    case when p_paid_amount > 0 then p_payment_method else null end, p_occurred_at, v_actor);

  -- Send any cent-rounding remainder to the last line with a positive value;
  -- never allocate freight cents to a zero-value line just because it is last.
  select max(entry.ordinality)::integer into v_last_alloc_line
  from jsonb_array_elements(p_lines) with ordinality as entry(value, ordinality)
  where round((entry.value->>'quantity')::numeric * (entry.value->>'unit_cost')::numeric, 2) > 0;
  v_remaining := p_other_cost_total;
  for v_item in select value from jsonb_array_elements(p_lines) loop
    v_line_no := v_line_no + 1;
    select * into v_product from public.products where business_id = p_business_id and id = (v_item->>'product_id')::uuid;
    select * into v_unit from public.product_units where business_id = p_business_id and id = v_product.unit_id;
    v_qty := (v_item->>'quantity')::numeric;
    v_cost := (v_item->>'unit_cost')::numeric;
    v_line_total := round(v_qty * v_cost, 2);
    if v_subtotal > 0 and v_line_no = v_last_alloc_line then
      v_alloc := v_remaining;
    else
      -- Floor intermediate allocations in cents so they cannot exceed the cost pool.
      v_alloc := case
        when v_subtotal > 0 then floor(p_other_cost_total * v_line_total / v_subtotal * 100) / 100
        else 0
      end;
      v_remaining := v_remaining - v_alloc;
    end if;
    insert into public.purchase_lines (business_id, purchases_document_id, line_no, product_id,
      product_name_bn_snapshot, product_name_en_snapshot, sku_snapshot, unit_name_bn_snapshot,
      quantity, unit_cost, line_total, allocated_other_cost, landed_unit_cost)
    values (p_business_id, v_doc_id, v_line_no, v_product.id, v_product.name_bn, v_product.name_en,
      v_product.sku, v_unit.name_bn, v_qty, v_cost, v_line_total, v_alloc,
      round((v_line_total + v_alloc) / v_qty, 6));
    select * into v_balance from public.inventory_balances where business_id = p_business_id and product_id = v_product.id for update;
    update public.inventory_balances set quantity = quantity + v_qty,
      first_movement_at = coalesce(first_movement_at, now()), updated_at = now()
      where business_id = p_business_id and product_id = v_product.id;
    insert into public.inventory_movements (business_id, product_id, movement_type, quantity_delta,
      quantity_after, source_kind, source_id, operation_id, reason, created_by, unit_cost, value_delta)
    values (p_business_id, v_product.id, 'purchase', v_qty, v_balance.quantity + v_qty,
      'purchase', v_doc_id, gen_random_uuid(), 'Purchase ' || v_invoice, v_actor,
      round((v_line_total + v_alloc) / v_qty, 6), v_line_total + v_alloc);
  end loop;

  insert into public.business_audit_log (business_id, actor_id, action, record_type, record_id, details)
  values (p_business_id, v_actor, 'PURCHASE_POSTED', 'purchases_document', v_doc_id,
    jsonb_build_object('invoice_no', v_invoice, 'total_amount', v_total, 'paid_amount', p_paid_amount, 'operation_id', p_operation_id));
  return jsonb_build_object('id', v_doc_id, 'invoice_no', v_invoice, 'total_amount', v_total, 'duplicate', false);
end;
$$;

revoke all on function public.post_purchase(uuid, uuid, jsonb, numeric, numeric, text, text, uuid, timestamptz, text) from public, anon, authenticated;
grant execute on function public.post_purchase(uuid, uuid, jsonb, numeric, numeric, text, text, uuid, timestamptz, text) to authenticated;

commit;
