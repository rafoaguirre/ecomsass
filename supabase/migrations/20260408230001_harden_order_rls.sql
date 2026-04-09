-- Harden order insert RLS: orders are created via the API using service_role,
-- but if a customer accesses the DB directly they should only be able to
-- insert orders in PLACED status with sensible defaults.

-- Drop the permissive insert policy
drop policy if exists "Customers can insert orders" on public.orders;

-- Customers can only insert orders in PLACED status for themselves
create policy "Customers can insert orders"
  on public.orders for insert
  with check (
    auth.uid() = user_id
    and status = 'PLACED'::public.order_status
  );

-- Drop the permissive item insert policy
drop policy if exists "Insert order items with order" on public.order_items;

-- Order items: can only insert for orders the user owns AND that are in PLACED status
create policy "Insert order items with order"
  on public.order_items for insert
  with check (
    order_id in (
      select id from public.orders
      where user_id = auth.uid()
        and status = 'PLACED'::public.order_status
    )
  );
