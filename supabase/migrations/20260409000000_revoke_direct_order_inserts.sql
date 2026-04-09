-- Revoke direct order/item inserts from authenticated users.
-- Orders are created exclusively via the API using service_role,
-- so users should never insert directly via PostgREST.

-- Drop the existing insert policies
drop policy if exists "Customers can insert orders" on public.orders;
drop policy if exists "Insert order items with order" on public.order_items;

-- No insert policies = authenticated users cannot insert via PostgREST.
-- The API uses service_role which bypasses RLS entirely.
