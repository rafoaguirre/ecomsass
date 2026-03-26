-- Seed data for local development
-- Requires Supabase local auth to create users first, then we populate profiles.
--
-- NOTE: In local dev, Supabase creates auth.users automatically when you sign up
-- through the dashboard or API. This seed populates the public tables that extend auth.
-- The UUIDs below are deterministic so tests/dev can reference them.

-- Deterministic UUIDs for dev
-- vendor user:   11111111-1111-1111-1111-111111111111
-- customer user: 22222222-2222-2222-2222-222222222222

-- Insert auth users (Supabase local dev allows direct inserts into auth schema)
insert into auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, instance_id, aud, role)
values
  (
    '11111111-1111-1111-1111-111111111111',
    'vendor@example.com',
    crypt('password123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Demo Vendor"}',
    now(), now(),
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated'
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'customer@example.com',
    crypt('password123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Demo Customer"}',
    now(), now(),
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated'
  )
on conflict (id) do nothing;

-- Seed identities for auth (required by Supabase auth for email login)
insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
values
  (
    '11111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    '{"sub":"11111111-1111-1111-1111-111111111111","email":"vendor@example.com"}',
    'email',
    '11111111-1111-1111-1111-111111111111',
    now(), now(), now()
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    '22222222-2222-2222-2222-222222222222',
    '{"sub":"22222222-2222-2222-2222-222222222222","email":"customer@example.com"}',
    'email',
    '22222222-2222-2222-2222-222222222222',
    now(), now(), now()
  )
on conflict (id) do nothing;

-- Profiles
insert into public.profiles (id, email, full_name, account_tier, account_status, role, verification_status)
values
  ('11111111-1111-1111-1111-111111111111', 'vendor@example.com', 'Demo Vendor', 'BasicMerchant', 'Active', 'Vendor', 'Verified'),
  ('22222222-2222-2222-2222-222222222222', 'customer@example.com', 'Demo Customer', 'GeneralUser', 'Active', 'Customer', 'Verified')
on conflict (id) do nothing;

-- Vendor profile
insert into public.vendor_profiles (id, user_id, business_name, verification_status, agreement_accepted, onboarding_completed)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Demo Shop Inc.', 'Verified', true, true)
on conflict (id) do nothing;

-- Store
insert into public.stores (id, vendor_profile_id, name, description, slug, store_type, is_active, address)
values
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Demo Store',
    'A sample store for local development and testing.',
    'demo-store',
    'GENERAL',
    true,
    '{"street":"123 Main St","city":"San Francisco","state":"CA","postalCode":"94105","country":"US"}'
  )
on conflict (id) do nothing;
