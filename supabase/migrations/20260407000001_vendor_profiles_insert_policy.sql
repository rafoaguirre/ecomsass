-- Allow authenticated users to create their own profile & vendor profile.
-- Needed for the defensive auto-create in the onboarding flow
-- (covers accounts created before the handle_new_user trigger).

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can insert own vendor profile"
  on public.vendor_profiles for insert
  with check (auth.uid() = user_id);
