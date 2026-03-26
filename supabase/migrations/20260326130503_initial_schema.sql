-- Phase 1.1: Initial schema for profiles, vendor_profiles, stores
-- Matches domain entities: UserAccount, VendorProfile, Store

-- ============================================================
-- Enum types (mirror packages/domain/src/enums)
-- ============================================================

create type public.account_tier as enum (
  'GeneralUser',
  'BasicMerchant',
  'PlusMerchant',
  'PremiumMerchant',
  'EnterpriseMerchant',
  'MarketplaceBasic',
  'MarketplacePremium'
);

create type public.account_status as enum (
  'Active',
  'Suspended',
  'Inactive',
  'Closed'
);

create type public.user_role as enum (
  'Admin',
  'Vendor',
  'Customer',
  'Buyer',
  'Supplier',
  'ChildAccount',
  'SuperAdmin'
);

create type public.verification_status as enum (
  'Unverified',
  'Pending',
  'Verified',
  'Rejected',
  'Suspended'
);

create type public.store_type as enum (
  'GENERAL',
  'RESTAURANT',
  'SCHOOL',
  'CAFETERIA',
  'EVENTS',
  'MARKETPLACE'
);

-- ============================================================
-- profiles (maps to UserAccount entity)
-- ============================================================

create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text        not null,
  full_name   text        not null,
  default_locale text     not null default 'en',
  account_tier   public.account_tier   not null default 'GeneralUser',
  account_status public.account_status not null default 'Active',
  role           public.user_role      not null default 'Customer',
  stripe_customer_id text,
  marketing_consent   boolean not null default false,
  agreement_accepted  boolean not null default false,
  verification_status public.verification_status not null default 'Unverified',
  preferences jsonb   not null default '{"emailNotifications":true,"smsNotifications":false,"marketingEmails":false}',
  metadata    jsonb   not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create unique index profiles_email_idx on public.profiles (email);

-- ============================================================
-- vendor_profiles (maps to VendorProfile entity)
-- ============================================================

create table public.vendor_profiles (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  business_name text not null,
  phone         text,
  phone_country_code text,
  addresses     jsonb not null default '[]',
  verification_status public.verification_status not null default 'Unverified',
  stripe_connect_id text,
  agreement_accepted  boolean not null default false,
  onboarding_completed boolean not null default false,
  metadata      jsonb not null default '{}',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create unique index vendor_profiles_user_id_idx on public.vendor_profiles (user_id);
create index vendor_profiles_verification_idx on public.vendor_profiles (verification_status);

-- ============================================================
-- stores (maps to Store entity)
-- ============================================================

create table public.stores (
  id                uuid primary key default gen_random_uuid(),
  vendor_profile_id uuid not null references public.vendor_profiles(id) on delete cascade,
  name              text not null,
  description       text,
  email             text,
  phone_number      text,
  phone_country_code text,
  address           jsonb not null default '{}',
  slug              text not null,
  store_type        public.store_type not null default 'GENERAL',
  is_active         boolean not null default true,
  operating_hours   jsonb,
  metadata          jsonb not null default '{}',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create unique index stores_slug_idx on public.stores (slug);
create index stores_vendor_profile_id_idx on public.stores (vendor_profile_id);
create index stores_is_active_idx on public.stores (is_active) where is_active = true;

-- ============================================================
-- Auto-update updated_at trigger
-- ============================================================

create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.update_updated_at();

create trigger vendor_profiles_updated_at
  before update on public.vendor_profiles
  for each row execute function public.update_updated_at();

create trigger stores_updated_at
  before update on public.stores
  for each row execute function public.update_updated_at();

-- ============================================================
-- Row-level security policies
-- ============================================================

alter table public.profiles enable row level security;
alter table public.vendor_profiles enable row level security;
alter table public.stores enable row level security;

-- Profiles: users can read/update their own profile
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Vendor profiles: vendors can read/update their own
create policy "Vendors can read own vendor profile"
  on public.vendor_profiles for select
  using (auth.uid() = user_id);

create policy "Vendors can update own vendor profile"
  on public.vendor_profiles for update
  using (auth.uid() = user_id);

-- Stores: public read for active stores, vendors manage their own
create policy "Anyone can read active stores"
  on public.stores for select
  using (is_active = true);

create policy "Vendors can manage own stores"
  on public.stores for all
  using (
    vendor_profile_id in (
      select vp.id from public.vendor_profiles vp where vp.user_id = auth.uid()
    )
  );
