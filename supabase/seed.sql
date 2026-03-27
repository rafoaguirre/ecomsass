-- Seed data for local development (public schema only).
--
-- IMPORTANT:
-- 1) Create auth users through Supabase Auth API/admin flow first.
-- 2) This seed links public data to those users via email lookup.
-- 3) Do not insert directly into auth.users/auth.identities.

-- Profiles (created only when matching auth users exist)
insert into public.profiles (id, email, full_name, account_tier, account_status, role, verification_status)
select
  u.id,
  u.email,
  'Demo Vendor',
  'BasicMerchant',
  'Active',
  'Vendor',
  'Verified'
from auth.users u
where u.email = 'vendor@example.com'
on conflict (id) do nothing;

insert into public.profiles (id, email, full_name, account_tier, account_status, role, verification_status)
select
  u.id,
  u.email,
  'Demo Customer',
  'GeneralUser',
  'Active',
  'Customer',
  'Verified'
from auth.users u
where u.email = 'customer@example.com'
on conflict (id) do nothing;

-- Vendor profile
insert into public.vendor_profiles (
  id,
  user_id,
  business_name,
  verification_status,
  agreement_accepted,
  onboarding_completed
)
select
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  p.id,
  'Demo Shop Inc.',
  'Verified',
  true,
  true
from public.profiles p
where p.email = 'vendor@example.com'
on conflict (id) do nothing;

-- Store
insert into public.stores (id, vendor_profile_id, name, description, slug, store_type, is_active, address)
select
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  vp.id,
  'Demo Store',
  'A sample store for local development and testing.',
  'demo-store',
  'GENERAL',
  true,
  '{"street":"123 Main St","city":"San Francisco","state":"CA","postalCode":"94105","country":"US"}'
from public.vendor_profiles vp
where vp.business_name = 'Demo Shop Inc.'
on conflict (id) do nothing;
