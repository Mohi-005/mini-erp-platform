-- ==============================================================================
-- Migration: 20261109000100_grant_products_name_banglish_insert.sql
-- Description: Grant column-level INSERT on products(name_banglish) to authenticated
--              role to permit canonical catalogue adoption with multilingual names.
-- Target: mini erp dev (jujwnhwrktmimtcnljsd)
-- ==============================================================================

begin;

grant insert (name_banglish)
  on table public.products
  to authenticated;

commit;
