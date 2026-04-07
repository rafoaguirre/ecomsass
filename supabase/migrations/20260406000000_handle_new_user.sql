-- Phase 3: Auto-create profile records on Supabase Auth signup
--
-- When a user signs up via supabase.auth.signUp(), only an auth.users row
-- is created. This trigger automatically creates the matching public.profiles
-- (and public.vendor_profiles for Vendor role) using metadata from signup.

-- ============================================================
-- Trigger function (runs as definer to bypass RLS)
-- ============================================================

create or replace function public.handle_new_user()
returns trigger as $$
declare
  user_role public.user_role;
begin
  -- Extract role from signup metadata, default to 'Customer'
  user_role := coalesce(
    (new.raw_user_meta_data->>'role')::public.user_role,
    'Customer'::public.user_role
  );

  -- Create profile row
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    user_role
  );

  -- If Vendor, also create vendor_profiles row
  if user_role = 'Vendor' then
    insert into public.vendor_profiles (user_id, business_name)
    values (
      new.id,
      coalesce(new.raw_user_meta_data->>'business_name', 'My Business')
    );
  end if;

  return new;
end;
$$ language plpgsql security definer;

-- ============================================================
-- Attach trigger to auth.users
-- ============================================================

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
