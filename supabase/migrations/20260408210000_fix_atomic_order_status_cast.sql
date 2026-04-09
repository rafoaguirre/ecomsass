-- Fix: cast status text to order_status enum in save_order_atomic

create or replace function public.save_order_atomic(
  p_order      jsonb,
  p_items      jsonb
) returns void as $$
begin
  -- Upsert the order row
  insert into public.orders (
    id, store_id, user_id, reference_id, status,
    subtotal_amount, subtotal_currency,
    tax_amount, tax_currency,
    discount_amount, discount_currency,
    delivery_fee_amount, delivery_fee_currency,
    total_amount, total_currency,
    payment, fulfillment, notes, metadata,
    created_at, updated_at
  ) values (
    (p_order->>'id')::uuid,
    (p_order->>'store_id')::uuid,
    (p_order->>'user_id')::uuid,
    p_order->>'reference_id',
    (p_order->>'status')::public.order_status,
    (p_order->>'subtotal_amount')::numeric,
    p_order->>'subtotal_currency',
    (p_order->>'tax_amount')::numeric,
    p_order->>'tax_currency',
    (p_order->>'discount_amount')::numeric,
    p_order->>'discount_currency',
    (p_order->>'delivery_fee_amount')::numeric,
    p_order->>'delivery_fee_currency',
    (p_order->>'total_amount')::numeric,
    p_order->>'total_currency',
    (p_order->'payment'),
    (p_order->'fulfillment'),
    (p_order->'notes'),
    coalesce(p_order->'metadata', '{}'::jsonb),
    (p_order->>'created_at')::timestamptz,
    (p_order->>'updated_at')::timestamptz
  )
  on conflict (id) do update set
    status = excluded.status,
    subtotal_amount = excluded.subtotal_amount,
    subtotal_currency = excluded.subtotal_currency,
    tax_amount = excluded.tax_amount,
    tax_currency = excluded.tax_currency,
    discount_amount = excluded.discount_amount,
    discount_currency = excluded.discount_currency,
    delivery_fee_amount = excluded.delivery_fee_amount,
    delivery_fee_currency = excluded.delivery_fee_currency,
    total_amount = excluded.total_amount,
    total_currency = excluded.total_currency,
    payment = excluded.payment,
    fulfillment = excluded.fulfillment,
    notes = excluded.notes,
    metadata = excluded.metadata,
    updated_at = excluded.updated_at;

  -- Delete existing items and re-insert (atomic within this transaction)
  delete from public.order_items where order_id = (p_order->>'id')::uuid;

  -- Insert new items
  if jsonb_array_length(p_items) > 0 then
    insert into public.order_items (
      id, order_id, product_id, product_name,
      variant_id, variant_name, quantity,
      unit_price_amount, unit_price_currency,
      subtotal_amount, subtotal_currency,
      discount_amount, discount_currency,
      total_amount, total_currency,
      metadata
    )
    select
      (item->>'id')::uuid,
      (p_order->>'id')::uuid,
      (item->>'product_id')::uuid,
      item->>'product_name',
      (item->>'variant_id')::uuid,
      item->>'variant_name',
      (item->>'quantity')::int,
      (item->>'unit_price_amount')::numeric,
      item->>'unit_price_currency',
      (item->>'subtotal_amount')::numeric,
      item->>'subtotal_currency',
      (item->>'discount_amount')::numeric,
      item->>'discount_currency',
      (item->>'total_amount')::numeric,
      item->>'total_currency',
      coalesce(item->'metadata', '{}'::jsonb)
    from jsonb_array_elements(p_items) as item;
  end if;
end;
$$ language plpgsql;
