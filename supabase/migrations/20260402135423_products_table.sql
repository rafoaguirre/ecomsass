-- Phase 2.2: Products table
-- Matches domain entity: Product / ProductVariant

-- ============================================================
-- Enum types
-- ============================================================

create type public.product_availability as enum (
  'AVAILABLE',
  'OUT_OF_STOCK',
  'DISCONTINUED',
  'COMING_SOO
);

-- ============================================================
-- products (maps to Product entity)
-- ============================================================

create table public.products (
  id                      uuid primary key default gen_random_uuid(),
  store_id                uuid not null references public.stores(id) on delete cascade,
  name                    text not null,
  slug                    text not null,
  description             text,
  price_amount            bigint not null,
  price_currency          text not null,
  compare_at_price_amount bigint,
  compare_at_price_currency text,
  images                  jsonb not null default '[]',
  category_id             uuid,
  supplier_id             uuid,
  availability            public.product_availability not null default 'AVAILABLE',
  inventory               jsonb,
  variants                jsonb,
  tags                    text[] not null default '{}',
  metadata                jsonb not null default '{}',
  is_active               boolean not null default true,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

-- Slug must be unique per store
create unique index products_store_slug_idx on public.products (store_id, slug);
create index products_store_id_idx on public.products (store_id);
create index products_availability_idx on public.products (availability);
create index products_is_active_idx on public.products (is_active) where is_active = true;

-- Auto-update updated_at
create trigger products_updated_at
  before update on public.products
  for each row execute function public.update_updated_at();

-- ============================================================
-- Row-level security
-- ============================================================

alter table public.products enable row level security;

-- Anyone can read available+active products
create policy "Anyone can read available products"
  on public.products for select
  using (availability <> 'OUT_OF_STOCK' and is_active = true);

-- Vendors can manage products in their own stores
create policy "Vendors can manage own products"
  on public.products for all
  using (
    store_id in (
      select s.id
      from public.stores s
      join public.vendor_profiles vp on s.vendor_profile_id = vp.id
      where vp.user_id = auth.uid()
    )
  );
