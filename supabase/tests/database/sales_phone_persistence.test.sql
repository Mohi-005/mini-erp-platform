-- ==============================================================================
-- Phase 2 Database Tests: Walk-in Customer Mobile Number Persistence
-- File: supabase/tests/database/sales_phone_persistence.test.sql
-- ==============================================================================

begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select no_plan();

-- 1. Verify customer_phone_snapshot column exists and is nullable
select has_column('public', 'sales_documents', 'customer_phone_snapshot', 'sales_documents has customer_phone_snapshot column');
select col_is_null('public', 'sales_documents', 'customer_phone_snapshot', 'customer_phone_snapshot is nullable');
select col_type_is('public', 'sales_documents', 'customer_phone_snapshot', 'text', 'customer_phone_snapshot is of type text');

-- 2. Verify post_sale RPC function signature and overload count
select is(
  (select count(*)::int from pg_proc where proname = 'post_sale' and pronamespace = 'public'::regnamespace),
  1,
  'public.post_sale has exactly one definition with no ambiguous overloads'
);

select ok(
  has_function_privilege('authenticated', 'public.post_sale(uuid,uuid,jsonb,numeric,text,uuid,timestamptz,text)', 'EXECUTE'),
  'authenticated role has execute grant on 8-argument post_sale'
);

select ok(
  not has_function_privilege('anon', 'public.post_sale(uuid,uuid,jsonb,numeric,text,uuid,timestamptz,text)', 'EXECUTE'),
  'anon role does not have execute grant on post_sale'
);

select ok(
  has_column_privilege('authenticated', 'public.sales_documents', 'customer_phone_snapshot', 'SELECT'),
  'authenticated role can select customer_phone_snapshot from sales_documents'
);

-- 3. Behavioral tests inside transaction
do $$
declare
  v_biz_id uuid;
  v_product_id uuid;
  v_user_id uuid;
  v_op1 uuid := gen_random_uuid();
  v_op2 uuid := gen_random_uuid();
  v_op3 uuid := gen_random_uuid();
  v_op4 uuid := gen_random_uuid();
  v_lines jsonb;
  v_res jsonb;
  v_doc_id uuid;
  v_phone_snap text;
  v_cust_id uuid;
  v_name_snap text;
  v_occ_at timestamptz;
  v_customer_id uuid;
  v_orig_phone text;
  v_cust_check public.customers%rowtype;
  v_audit_details jsonb;
begin
  select b.business_id, b.product_id
    into v_biz_id, v_product_id
    from public.inventory_balances b
    join public.inventory_cost_state c on c.business_id = b.business_id and c.product_id = b.product_id
   where b.quantity >= 10 and c.priced_quantity >= 10
   limit 1;

  select created_by into v_user_id from public.businesses where id = v_biz_id;
  select id, phone into v_customer_id, v_orig_phone from public.customers where business_id = v_biz_id and archived_at is null limit 1;

  execute format('set local role authenticated; set local request.jwt.claims = %L;', json_build_object('sub', v_user_id, 'role', 'authenticated')::text);

  v_lines := jsonb_build_array(
    jsonb_build_object(
      'product_id', v_product_id,
      'quantity', 1,
      'unit_price', 50,
      'base_quantity', 1
    )
  );

  -- Scenario A: Walk-in sale WITH mobile number
  v_res := public.post_sale(
    v_biz_id,
    null,
    v_lines,
    50,
    'CASH',
    v_op1,
    now(),
    '01712345678'
  );
  v_doc_id := (v_res->>'id')::uuid;
  select customer_phone_snapshot, customer_id, customer_name_snapshot, occurred_at
    into v_phone_snap, v_cust_id, v_name_snap, v_occ_at
    from public.sales_documents where id = v_doc_id;

  assert v_phone_snap = '01712345678', 'Scenario A Failed: Phone snapshot mismatch';
  assert v_cust_id is null, 'Scenario A Failed: Customer ID should be null';
  assert v_name_snap = 'Walk-in / Cash customer', 'Scenario A Failed: Name snapshot fallback';

  -- Verify audit metadata does NOT contain customer_phone_snapshot
  select details into v_audit_details
    from public.business_audit_log
   where business_id = v_biz_id and record_id = v_doc_id and action = 'SALE_POSTED';

  assert (v_audit_details ? 'customer_phone_snapshot') = false,
    'Privacy Defect: SALE_POSTED audit metadata must NOT contain customer_phone_snapshot';
  assert (v_audit_details ? 'invoice_no') = true, 'Audit missing invoice_no';
  assert (v_audit_details ? 'total_amount') = true, 'Audit missing total_amount';
  assert (v_audit_details ? 'paid_amount') = true, 'Audit missing paid_amount';
  assert (v_audit_details ? 'operation_id') = true, 'Audit missing operation_id';

  -- Scenario B: Walk-in sale WITHOUT mobile number (7 arguments positional)
  v_res := public.post_sale(
    v_biz_id,
    null,
    v_lines,
    50,
    'CASH',
    v_op2,
    now()
  );
  v_doc_id := (v_res->>'id')::uuid;
  select customer_phone_snapshot, customer_id into v_phone_snap, v_cust_id
    from public.sales_documents where id = v_doc_id;

  assert v_phone_snap is null, 'Scenario B Failed: Phone snapshot should be null';
  assert v_cust_id is null, 'Scenario B Failed: Customer ID should be null';

  -- Scenario C: Whitespace phone resolves to NULL
  v_res := public.post_sale(
    v_biz_id,
    null,
    v_lines,
    50,
    'CASH',
    v_op3,
    now(),
    '    '
  );
  v_doc_id := (v_res->>'id')::uuid;
  select customer_phone_snapshot into v_phone_snap from public.sales_documents where id = v_doc_id;
  assert v_phone_snap is null, 'Scenario C Failed: Whitespace phone should resolve to null';

  -- Scenario D: Registered customer sale preserves customer_id and does not modify master customer
  v_res := public.post_sale(
    v_biz_id,
    v_customer_id,
    v_lines,
    50,
    'CASH',
    v_op4,
    now(),
    '01999999999'
  );
  v_doc_id := (v_res->>'id')::uuid;
  select customer_phone_snapshot, customer_id into v_phone_snap, v_cust_id
    from public.sales_documents where id = v_doc_id;

  assert v_phone_snap = '01999999999', 'Scenario D Failed: Registered customer phone snapshot';
  assert v_cust_id = v_customer_id, 'Scenario D Failed: Customer ID mismatch';

  select * into v_cust_check from public.customers where id = v_customer_id;
  assert v_cust_check.phone is not distinct from v_orig_phone, 'Scenario D Failed: Master customer record was altered';

  -- Scenario E: Idempotent retry with same operation_id returns duplicate
  v_res := public.post_sale(
    v_biz_id,
    null,
    v_lines,
    50,
    'CASH',
    v_op1,
    v_occ_at,
    '01712345678'
  );
  assert (v_res->>'duplicate')::boolean = true, 'Scenario E Failed: Idempotent duplicate not detected';
end $$;

select pass('All Walk-in and Registered customer posting scenarios passed');

select finish();
rollback;
