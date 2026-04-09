-- Restrict vendor order updates to only status and fulfillment fields.
-- Monetary totals, payment info, user/store linkage, and reference IDs
-- must remain immutable when accessed via PostgREST (authenticated role).
--
-- The trigger only fires for the "authenticated" role so that trusted
-- service-role callers (API backend via save_order_atomic) can still
-- update payment status, fulfillment, etc. during order lifecycle.
--
-- Nullable columns use IS DISTINCT FROM to prevent NULL-bypass.

-- ============================================================
-- 1. Replace the permissive update policy (ownership check only)
-- ============================================================
drop policy if exists "Vendors can update store orders" on public.orders;

create policy "Vendors can update store orders"
  on public.orders for update
  using (
    store_id in (
      select s.id
      from public.stores s
      join public.vendor_profiles vp on s.vendor_profile_id = vp.id
      where vp.user_id = auth.uid()
    )
  );

-- ============================================================
-- 2. Trigger: enforce column immutability for authenticated role
-- ============================================================
create or replace function public.orders_immutable_columns()
returns trigger as $$
begin
  -- Only enforce for PostgREST user requests (authenticated role).
  -- Service-role and postgres callers (API backend) are trusted.
  if current_setting('role', true) is distinct from 'authenticated' then
    return new;
  end if;

  -- Identity / linkage fields (all NOT NULL — <> is safe)
  if new.id <> old.id then
    raise exception 'Cannot change order id';
  end if;
  if new.store_id <> old.store_id then
    raise exception 'Cannot change order store_id';
  end if;
  if new.user_id <> old.user_id then
    raise exception 'Cannot change order user_id';
  end if;
  if new.reference_id <> old.reference_id then
    raise exception 'Cannot change order reference_id';
  end if;

  -- Monetary fields — NOT NULL columns use <>
  if new.subtotal_amount <> old.subtotal_amount
    or new.subtotal_currency <> old.subtotal_currency then
    raise exception 'Cannot change order subtotal';
  end if;
  if new.total_amount <> old.total_amount
    or new.total_currency <> old.total_currency then
    raise exception 'Cannot change order total';
  end if;

  -- Monetary fields — nullable columns use IS DISTINCT FROM
  if new.tax_amount is distinct from old.tax_amount
    or new.tax_currency is distinct from old.tax_currency then
    raise exception 'Cannot change order tax';
  end if;
  if new.discount_amount is distinct from old.discount_amount
    or new.discount_currency is distinct from old.discount_currency then
    raise exception 'Cannot change order discount';
  end if;
  if new.delivery_fee_amount is distinct from old.delivery_fee_amount
    or new.delivery_fee_currency is distinct from old.delivery_fee_currency then
    raise exception 'Cannot change order delivery fee';
  end if;

  -- Payment info (NOT NULL jsonb — <> is safe)
  if new.payment <> old.payment then
    raise exception 'Cannot change order payment';
  end if;

  -- Timestamp
  if new.created_at <> old.created_at then
    raise exception 'Cannot change order created_at';
  end if;

  -- ----------------------------------------------------------------
  -- Status transition enforcement (mirrors domain VALID_TRANSITIONS)
  -- ----------------------------------------------------------------
  if new.status is distinct from old.status then
    -- Validate the transition against the domain state machine.
    -- Only forward-moving, business-valid transitions are allowed.
    case old.status
      when 'PLACED' then
        if new.status not in ('CONFIRMED', 'CANCELLED') then
          raise exception 'Invalid order transition: % → %', old.status, new.status;
        end if;
      when 'CONFIRMED' then
        if new.status not in ('PROCESSING', 'CANCELLED') then
          raise exception 'Invalid order transition: % → %', old.status, new.status;
        end if;
      when 'PROCESSING' then
        if new.status not in ('PACKED', 'CANCELLED') then
          raise exception 'Invalid order transition: % → %', old.status, new.status;
        end if;
      when 'PACKED' then
        if new.status not in ('IN_TRANSIT', 'CANCELLED') then
          raise exception 'Invalid order transition: % → %', old.status, new.status;
        end if;
      when 'IN_TRANSIT' then
        if new.status <> 'DELIVERED' then
          raise exception 'Invalid order transition: % → %', old.status, new.status;
        end if;
      when 'DELIVERED' then
        if new.status not in ('REFUNDED', 'PARTIALLY_REFUNDED', 'COMPLETED') then
          raise exception 'Invalid order transition: % → %', old.status, new.status;
        end if;
      when 'PARTIALLY_REFUNDED' then
        if new.status not in ('REFUNDED', 'COMPLETED') then
          raise exception 'Invalid order transition: % → %', old.status, new.status;
        end if;
      else
        -- Terminal statuses: CANCELLED, REFUNDED, COMPLETED, and others
        raise exception 'Cannot transition from terminal status: %', old.status;
    end case;
  end if;

  return new;
end;
$$ language plpgsql;

drop trigger if exists orders_enforce_immutable_columns on public.orders;

create trigger orders_enforce_immutable_columns
  before update on public.orders
  for each row execute function public.orders_immutable_columns();

-- ============================================================
-- 3. Restrict RPC functions to service_role only
--    Prevents authenticated users from calling save_order_atomic
--    or next_order_reference directly to bypass RLS.
-- ============================================================
revoke execute on function public.save_order_atomic(jsonb, jsonb) from public;
revoke execute on function public.save_order_atomic(jsonb, jsonb) from anon;
revoke execute on function public.save_order_atomic(jsonb, jsonb) from authenticated;
grant  execute on function public.save_order_atomic(jsonb, jsonb) to service_role;

revoke execute on function public.next_order_reference(uuid) from public;
revoke execute on function public.next_order_reference(uuid) from anon;
revoke execute on function public.next_order_reference(uuid) from authenticated;
grant  execute on function public.next_order_reference(uuid) to service_role;
