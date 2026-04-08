-- Phase 6.2: Orders and order items tables
-- Matches domain entities: Order, OrderItem

-- ============================================================
-- Enum types (mirror packages/domain/src/enums)
-- ============================================================

create type public.order_status as enum (
  'DRAFT',
  'IN_CART',
  'PLACED',
  'CONFIRMED',
  'PROCESSING',
  'PACKED',
  'IN_TRANSIT',
  'DELIVERED',
  'COMPLETED',
  'CANCELLED',
  'REFUNDED',
  'PARTIALLY_REFUNDED',
  'SKIPPED'
);

create type public.payment_status as enum (
  'PENDING',
  'INITIATED',
  'PROCESSING',
  'PAID',
  'PARTIALLY_PAID',
  'FAILED',
  'REFUNDED',
  'PARTIALLY_REFUNDED',
  'CANCELLED'
);

create type public.payment_method as enum (
  'CASH',
  'CARD',
  'STRIPE',
  'CREDIT',
  'BANK_TRANSFER',
  'CRYPTO'
);

create type public.fulfillment_type as enum (
  'PICKUP',
  'DELIVERY',
  'SHIPPING'
);

-- ============================================================
-- orders (maps to Order entity)
-- ============================================================

create table public.orders (
  id                      uuid primary key default gen_random_uuid(),
  store_id                uuid not null references public.stores(id) on delete cascade,
  user_id                 uuid not null references public.profiles(id) on delete cascade,
  reference_id            text not null,
  status                  public.order_status not null default 'PLACED',

  -- Money fields stored as separate amount + currency for queryability
  subtotal_amount         bigint not null,
  subtotal_currency       text   not null,
  tax_amount              bigint,
  tax_currency            text,
  discount_amount         bigint,
  discount_currency       text,
  delivery_fee_amount     bigint,
  delivery_fee_currency   text,
  total_amount            bigint not null,
  total_currency          text   not null,

  -- Flexible JSONB columns for payment-agnostic and fulfillment data
  payment                 jsonb  not null default '{}',
  fulfillment             jsonb  not null default '{}',
  notes                   jsonb  not null default '[]',
  metadata                jsonb  not null default '{}',

  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

-- Reference ID unique per store
create unique index orders_reference_id_idx on public.orders (store_id, reference_id);
create index orders_store_id_idx on public.orders (store_id);
create index orders_user_id_idx on public.orders (user_id);
create index orders_status_idx on public.orders (status);
create index orders_created_at_idx on public.orders (created_at desc);

-- ============================================================
-- order_items (maps to OrderItem entity)
-- ============================================================

create table public.order_items (
  id                      uuid primary key default gen_random_uuid(),
  order_id                uuid not null references public.orders(id) on delete cascade,
  product_id              uuid not null references public.products(id) on delete restrict,
  product_name            text not null,
  variant_id              uuid,
  variant_name            text,
  quantity                integer not null check (quantity > 0),

  -- Money fields
  unit_price_amount       bigint not null,
  unit_price_currency     text   not null,
  subtotal_amount         bigint not null,
  subtotal_currency       text   not null,
  discount_amount         bigint,
  discount_currency       text,
  total_amount            bigint not null,
  total_currency          text   not null,

  metadata                jsonb  not null default '{}'
);

create index order_items_order_id_idx on public.order_items (order_id);
create index order_items_product_id_idx on public.order_items (product_id);

-- ============================================================
-- Auto-update updated_at trigger
-- ============================================================

create trigger orders_updated_at
  before update on public.orders
  for each row execute function public.update_updated_at();

-- ============================================================
-- Row-level security
-- ============================================================

alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- Customers can read their own orders
create policy "Customers can read own orders"
  on public.orders for select
  using (auth.uid() = user_id);

-- Vendors can read orders for their stores
create policy "Vendors can read store orders"
  on public.orders for select
  using (
    store_id in (
      select s.id
      from public.stores s
      join public.vendor_profiles vp on s.vendor_profile_id = vp.id
      where vp.user_id = auth.uid()
    )
  );

-- Vendors can update orders for their stores (status transitions)
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

-- Customers can insert orders (place orders)
create policy "Customers can insert orders"
  on public.orders for insert
  with check (auth.uid() = user_id);

-- Order items: inherit access from parent order
create policy "Read order items via order access"
  on public.order_items for select
  using (
    order_id in (select id from public.orders)
  );

-- Allow inserting order items when placing an order
create policy "Insert order items with order"
  on public.order_items for insert
  with check (
    order_id in (select id from public.orders where user_id = auth.uid())
  );
