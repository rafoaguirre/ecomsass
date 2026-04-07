import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { User } from '@supabase/supabase-js';

/**
 * Returns the authenticated Supabase user, or redirects to /login.
 */
export async function getAuthUser(): Promise<User> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');
  return user;
}

/**
 * Returns the vendor's store ID (resolving user → vendor_profile → store).
 * Redirects to /login if unauthenticated, /onboarding if no profile or store.
 */
export async function requireStoreId(): Promise<string> {
  const user = await getAuthUser();
  const supabase = await createClient();

  const { data: vp } = await supabase
    .from('vendor_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!vp) redirect('/onboarding');

  const { data: store } = await supabase
    .from('stores')
    .select('id')
    .eq('vendor_profile_id', vp.id)
    .limit(1)
    .single();

  if (!store) redirect('/onboarding');

  return store.id;
}

/**
 * Same as requireStoreId but returns { storeId } or { error } for server actions
 * (which cannot call redirect).
 */
export async function getStoreIdForAction(): Promise<{ storeId: string } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Not authenticated.' };

  const { data: vp } = await supabase
    .from('vendor_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!vp) return { error: 'Vendor profile not found.' };

  const { data: store } = await supabase
    .from('stores')
    .select('id')
    .eq('vendor_profile_id', vp.id)
    .limit(1)
    .single();

  if (!store) return { error: 'Store not found.' };

  return { storeId: store.id };
}
