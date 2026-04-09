-- Extend profile column protection: lock down account_status, account_tier,
-- and verification_status in addition to role.

drop policy if exists "Users can update own profile" on public.profiles;

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
