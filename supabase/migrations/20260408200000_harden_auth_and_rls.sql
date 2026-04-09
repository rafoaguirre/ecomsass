-- Phase 6: Security hardening
--
-- 1. Fix signup trigger: only allow Customer/Vendor roles at signup,
--    copy role to app_metadata (server-controlled, not user-editable).
-- 2. Restrict profile RLS: prevent users from updating role/status columns.

-- ============================================================
-- 1. Replace signup trigger to harden role assignment
-- ============================================================

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

  -- Copy role to app_metadata (server-controlled, not user-editable)
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

-- ============================================================
-- 2. Tighten profile RLS: prevent users from changing their own role/status
-- ============================================================

-- Drop the permissive update policy
drop policy if exists "Users can update own profile" on public.profiles;

-- Re-create with column restriction: only allow updating safe columns
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (
    -- All privileged columns must remain unchanged
    role = (select role from public.profiles where id = auth.uid())
    and account_status = (select account_status from public.profiles where id = auth.uid())
    and account_tier = (select account_tier from public.profiles where id = auth.uid())
    and verification_status = (select verification_status from public.profiles where id = auth.uid())
  );
