-- Phase 7.1: Atomic stock reservation
--
-- Atomically decrements inventory for a batch of products.
-- If any product has insufficient stock, the entire batch rolls back.
-- Products that don't track inventory are silently skipped.

create or replace function public.reserve_stock_batch(
  p_items jsonb  -- [{product_id: "<uuid>", quantity: <int>}, ...]
) returns void as $$
declare
  v_item  jsonb;
  v_rows  int;
begin
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    if (v_item->>'quantity')::int <= 0 then
      raise exception 'Quantity must be positive for product %', v_item->>'product_id'
        using errcode = 'P0001';
    end if;

    update public.products
    set
      inventory = jsonb_set(
        inventory,
        '{quantity}',
        to_jsonb((inventory->>'quantity')::int - (v_item->>'quantity')::int)
      ),
      updated_at = now()
    where id = (v_item->>'product_id')::uuid
      and inventory is not null
      and (inventory->>'trackQuantity')::boolean = true
      and (inventory->>'quantity')::int >= (v_item->>'quantity')::int;

    get diagnostics v_rows = row_count;

    -- If no rows updated, check whether it's an actual stock shortage
    if v_rows = 0 then
      if exists (
        select 1 from public.products
        where id = (v_item->>'product_id')::uuid
          and inventory is not null
          and (inventory->>'trackQuantity')::boolean = true
      ) then
        raise exception 'Insufficient stock for product %', v_item->>'product_id'
          using errcode = 'P0001';
      end if;
      -- Product doesn't track inventory — no-op
    end if;
  end loop;
end;
$$ language plpgsql;

-- Lock down to service_role only
revoke execute on function public.reserve_stock_batch(jsonb) from public;
revoke execute on function public.reserve_stock_batch(jsonb) from anon;
revoke execute on function public.reserve_stock_batch(jsonb) from authenticated;
grant  execute on function public.reserve_stock_batch(jsonb) to service_role;
