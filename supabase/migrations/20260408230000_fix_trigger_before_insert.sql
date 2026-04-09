-- Fix: change trigger from AFTER to BEFORE INSERT so that
-- mutating NEW.raw_app_meta_data actually persists the role
-- into app_metadata on the auth.users row.

-- Drop the existing AFTER trigger
drop trigger if exists on_auth_user_created on auth.users;

-- Recreate the function (unchanged logic, just ensuring latest version)
create or replace function public.handle_new_user()
returns trigger as $$
declare
  raw_role  text;
  safe_role public.user_role;
begin
  -- Extract role from signup metadata
  raw_role := new.raw_user_meta_data->>'role';

  -- Only allow safe self-service roles at signup; default to Customer
  if raw_role in ('Customer', 'Vendor') then
    safe_role := raw_role::public.user_role;
  else
    safe_role := 'Customer'::public.user_role;
  end if;

  -- Copy role to app_metadata (server-controlled, not user-editable).
  -- This only works in a BEFORE trigger where NEW mutations persist.
  new.raw_app_meta_data := coalesce(new.raw_app_meta_data, '{}'::jsonb)
    || jsonb_build_object('role', safe_role::text);

  -- Create profile row
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    safe_role
  );

  -- If Vendor, also create vendor_profiles row
  if safe_role = 'Vendor' then
    insert into public.vendor_profiles (user_id, business_name)
    values (
      new.id,
      coalesce(new.raw_user_meta_data->>'business_name', 'My Business')
    );
  end if;

  return new;
end;
$$ language plpgsql security definer;

-- Re-attach as BEFORE INSERT so NEW mutations persist
create trigger on_auth_user_created
  before insert on auth.users
  for each row execute function public.handle_new_user();
