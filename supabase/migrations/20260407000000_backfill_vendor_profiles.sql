-- Backfill: create profiles + vendor_profiles for existing users
-- who signed up before the handle_new_user trigger was deployed.

-- Step 1: Create missing profiles rows for auth.users that have none
insert into public.profiles (id, email, full_name, role)
select
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data->>'full_name', ''),
  coalesce((u.raw_user_meta_data->>'role')::public.user_role, 'Customer'::public.user_role)
from auth.users u
where not exists (
  select 1 from public.profiles p where p.id = u.id
);

-- Step 2: Create missing vendor_profiles rows for Vendor users
insert into public.vendor_profiles (user_id, business_name)
select
  p.id,
  coalesce(u.raw_user_meta_data->>'business_name', 'My Business')
from public.profiles p
join auth.users u on u.id = p.id
where p.role = 'Vendor'
  and not exists (
    select 1 from public.vendor_profiles vp where vp.user_id = p.id
  );
