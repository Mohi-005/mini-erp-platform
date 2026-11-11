-- ==============================================================================
-- Migration: 20261107000200_fix_post_sale_integrity.sql
-- Description: Forward-migration ensuring post_sale RPC contract integrity
--              (Removes nonexistent subtotal_amount from sales_documents insert,
--               preserves walk-in customer fallback, and confirms execution grants)
-- Target: mini erp dev (jujwnhwrktmimtcnljsd)
-- ==============================================================================

begin;

create or replace function public.post_sale(
  p_business_id uuid,
  p_customer_id uuid,
  p_lines jsonb,
  p_paid_amount numeric,
  p_payment_method text,
  p_operation_id uuid,
  p_occurred_at timestamptz
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
  v_item jsonb;
  v_product public.products%rowtype;
  v_unit public.product_units%rowtype;
  v_balance public.inventory_balances%rowtype;
  v_cost public.inventory_cost_state%rowtype;
  v_customer public.customers%rowtype;
  v_doc_id uuid;
  v_invoice text;
  v_fingerprint text := md5(jsonb_build_object('business_id', p_business_id, 'customer_id', p_customer_id, 'lines', p_lines, 'paid_amount', p_paid_amount, 'payment_method', p_payment_method, 'occurred_at', p_occurred_at)::text);
  v_existing_fingerprint text;
  v_total numeric := 0;
  v_line_total numeric;
  v_qty numeric;
  v_price numeric;
  v_unit_name text;
  v_base_qty numeric;
  v_current numeric;
  v_known_cogs numeric;
  v_line_no integer := 0;
  v_result record;
  v_allow_override boolean;
begin
  if v_actor is null then raise exception 'authentication_required' using errcode = '42501'; end if;
  if p_business_id is null or p_operation_id is null then raise exception 'required_argument_missing' using errcode = '22023'; end if;
  if not private.has_business_permission(p_business_id, 'sales.create') then raise exception 'not_authorized' using errcode = '42501'; end if;
  if p_lines is null or jsonb_typeof(p_lines) <> 'array' or jsonb_array_length(p_lines) not between 1 and 100 then raise exception 'invalid_sale_lines' using errcode = '22023'; end if;
  if p_paid_amount is null or p_paid_amount < 0 or p_paid_amount >= 'Infinity'::numeric or p_paid_amount <> round(p_paid_amount, 2) then raise exception 'invalid_paid_amount' using errcode = '22023'; end if;
  if p_payment_method is not null and p_payment_method not in ('CASH','BKASH','NAGAD','BANK') then raise exception 'invalid_payment_method' using errcode = '22023'; end if;
  if p_paid_amount > 0 and p_payment_method is null then raise exception 'payment_method_required' using errcode = '22023'; end if;
  if p_occurred_at is null then raise exception 'occurred_at_required' using errcode = '22023'; end if;

  perform pg_advisory_xact_lock(hashtextextended(p_business_id::text || p_operation_id::text, 0));
  select id, invoice_no, request_fingerprint into v_doc_id, v_invoice, v_existing_fingerprint from public.sales_documents where business_id = p_business_id and operation_id = p_operation_id;
  if found then
    if v_existing_fingerprint <> v_fingerprint then raise exception 'operation_id_conflict' using errcode = '22023'; end if;
    return jsonb_build_object('id', v_doc_id, 'invoice_no', v_invoice, 'duplicate', true);
  end if;

  v_allow_override := private.has_business_permission(p_business_id, 'sales.price_override');
  if p_customer_id is not null then
    select * into v_customer from public.customers where business_id = p_business_id and id = p_customer_id and archived_at is null;
    if not found then raise exception 'customer_not_found_or_archived' using errcode = 'P0002'; end if;
  end if;

  -- Lock products and balances in deterministic order, validating required base quantity
  for v_result in
    select distinct (entry->>'product_id')::uuid as product_id
    from jsonb_array_elements(p_lines) as entry
    order by 1
  loop
    select * into v_product from public.products where business_id = p_business_id and id = v_result.product_id for share;
    if not found or v_product.archived_at is not null then raise exception 'product_not_found_or_archived' using errcode = 'P0002'; end if;
    select * into v_balance from public.inventory_balances where business_id = p_business_id and product_id = v_result.product_id for update;
    if not found then raise exception 'inventory_balance_missing' using errcode = '23514'; end if;

    select coalesce(sum(coalesce((entry->>'base_quantity')::numeric, (entry->>'quantity')::numeric)), 0)
      into v_base_qty
      from jsonb_array_elements(p_lines) as entry where (entry->>'product_id')::uuid = v_result.product_id;
    if v_base_qty <= 0 or v_base_qty >= 'Infinity'::numeric then raise exception 'invalid_quantity' using errcode = '22023'; end if;
    if v_balance.quantity < v_base_qty then raise exception 'insufficient_stock' using errcode = '23514'; end if;
  end loop;

  for v_item in select value from jsonb_array_elements(p_lines) loop
    v_product := null;
    select * into v_product from public.products where business_id = p_business_id and id = (v_item->>'product_id')::uuid;
    v_qty := (v_item->>'quantity')::numeric;
    v_price := (v_item->>'unit_price')::numeric;
    if v_qty is null or v_qty <= 0 or v_qty >= 'Infinity'::numeric or v_price is null or v_price < 0 or v_price >= 'Infinity'::numeric or v_price <> round(v_price, 2) then raise exception 'invalid_sale_line' using errcode = '22023'; end if;
    v_total := v_total + round(v_qty * v_price, 2);
  end loop;
  v_total := round(v_total, 2);
  if v_total <= 0 then raise exception 'sale_total_must_be_positive' using errcode = '22023'; end if;
  if p_paid_amount > v_total then raise exception 'paid_exceeds_total' using errcode = '22023'; end if;
  if p_paid_amount < v_total and p_customer_id is null then raise exception 'customer_required_for_credit_sale' using errcode = '22023'; end if;

  v_doc_id := gen_random_uuid();
  v_invoice := 'S-' || to_char(p_occurred_at at time zone 'Asia/Dhaka', 'YYYYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  insert into public.sales_documents (id, business_id, invoice_no, operation_id, request_fingerprint, customer_id,
    customer_name_snapshot, total_amount, paid_amount_at_sale, payment_method, occurred_at, created_by)
  values (v_doc_id, p_business_id, v_invoice, p_operation_id, v_fingerprint, p_customer_id,
    coalesce(v_customer.name, 'Walk-in / Cash customer'),
    v_total, p_paid_amount,
    case when p_paid_amount > 0 then p_payment_method else null end, p_occurred_at, v_actor);

  for v_item in select value from jsonb_array_elements(p_lines) loop
    v_line_no := v_line_no + 1;
    select * into v_product from public.products where business_id = p_business_id and id = (v_item->>'product_id')::uuid;
    select * into v_unit from public.product_units where business_id = p_business_id and id = v_product.unit_id;
    v_qty := (v_item->>'quantity')::numeric;
    v_price := (v_item->>'unit_price')::numeric;
    v_unit_name := coalesce(nullif(btrim(v_item->>'unit_name'), ''), v_unit.name_bn);
    v_base_qty := coalesce((v_item->>'base_quantity')::numeric, v_qty);

    v_line_total := round(v_qty * v_price, 2);
    select * into v_balance from public.inventory_balances where business_id = p_business_id and product_id = v_product.id for update;
    select * into v_cost from public.inventory_cost_state where business_id = p_business_id and product_id = v_product.id for update;

    if found and v_cost.priced_quantity >= v_base_qty and v_cost.average_unit_cost > 0 then
      v_current := v_cost.average_unit_cost;
      v_known_cogs := round(v_base_qty * v_current, 2);
    else
      v_current := null;
      v_known_cogs := null;
    end if;

    insert into public.sales_lines (business_id, sales_document_id, line_no, product_id,
      product_name_bn_snapshot, product_name_en_snapshot, sku_snapshot, unit_name_bn_snapshot,
      quantity, unit_price, line_total, unit_cost_at_sale, cogs_amount, costing_status)
    values (p_business_id, v_doc_id, v_line_no, v_product.id, v_product.name_bn, v_product.name_en,
      v_product.sku, v_unit_name, v_qty, v_price, v_line_total, v_current, v_known_cogs,
      case when v_known_cogs is not null then 'KNOWN' else 'UNKNOWN' end);

    update public.inventory_balances set quantity = quantity - v_base_qty, updated_at = now()
      where business_id = p_business_id and product_id = v_product.id;

    insert into public.inventory_movements (business_id, product_id, movement_type, quantity_delta,
      quantity_after, source_kind, source_id, operation_id, reason, created_by, unit_cost, value_delta)
    values (p_business_id, v_product.id, 'sale', - v_base_qty, v_balance.quantity - v_base_qty,
      'sale', v_doc_id, gen_random_uuid(), 'Sale ' || v_invoice, v_actor,
      v_current, case when v_known_cogs is not null then - v_known_cogs else null end);
  end loop;

  insert into public.business_audit_log (business_id, actor_id, action, record_type, record_id, details)
  values (p_business_id, v_actor, 'SALE_POSTED', 'sales_document', v_doc_id,
    jsonb_build_object('invoice_no', v_invoice, 'total_amount', v_total, 'paid_amount', p_paid_amount, 'operation_id', p_operation_id));
  return jsonb_build_object('id', v_doc_id, 'invoice_no', v_invoice, 'total_amount', v_total, 'duplicate', false);
end;
$$;

revoke all on function public.post_sale(uuid, uuid, jsonb, numeric, text, uuid, timestamptz) from public, anon;
grant execute on function public.post_sale(uuid, uuid, jsonb, numeric, text, uuid, timestamptz) to authenticated;
grant execute on function public.post_sale(uuid, uuid, jsonb, numeric, text, uuid, timestamptz) to service_role;

commit;
