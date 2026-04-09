-- Enable RLS on store_order_counters and deny all direct access.
-- The table is only accessed via next_order_reference() and save_order_atomic() RPCs.

alter table public.store_order_counters enable row level security;

-- No policies = no direct access via the API (PostgREST).
-- The RPC functions run with the definer's privileges and bypass RLS.
