'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export type OnboardingState = { error: string } | null;

export async function createStore(
  _prev: OnboardingState,
  formData: FormData
): Promise<OnboardingState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'You must be signed in.' };
  }

  // Ensure profiles row exists (covers accounts created before trigger)
  const { data: profile } = await supabase.from('profiles').select('id').eq('id', user.id).single();

  if (!profile) {
    const { error: profileErr } = await supabase.from('profiles').insert({
      id: user.id,
      email: user.email ?? '',
      full_name: user.user_metadata?.full_name ?? '',
      role: 'Vendor',
    });
    if (profileErr) {
      return { error: 'Could not initialise profile. Please contact support.' };
    }
  }

  // Get vendor profile — create one if missing (covers accounts created before trigger)
  let { data: vendorProfile } = await supabase
    .from('vendor_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!vendorProfile) {
    const { data: created, error: createErr } = await supabase
      .from('vendor_profiles')
      .insert({
        user_id: user.id,
        business_name: user.user_metadata?.business_name ?? 'My Business',
      })
      .select('id')
      .single();

    if (createErr || !created) {
      return { error: 'Could not initialise vendor profile. Please contact support.' };
    }
    vendorProfile = created;
  }

  const name = formData.get('name') as string;
  const slug = formData.get('slug') as string;
  const description = formData.get('description') as string;
  const storeType = formData.get('storeType') as string;
  const email = formData.get('email') as string;
  const phone = formData.get('phone') as string;
  const street = formData.get('street') as string;
  const city = formData.get('city') as string;
  const province = formData.get('province') as string;
  const country = formData.get('country') as string;
  const postalCode = formData.get('postalCode') as string;

  const { error } = await supabase.from('stores').insert({
    vendor_profile_id: vendorProfile.id,
    name,
    slug,
    description: description || null,
    email: email || null,
    phone_number: phone || null,
    store_type: storeType || 'GENERAL',
    address: {
      street: street || '',
      city: city || '',
      province: province || '',
      country: country || '',
      postalCode: postalCode || '',
    },
  });

  if (error) {
    if (error.code === '23505') {
      return { error: 'That store URL slug is already taken. Please choose another.' };
    }
    return { error: error.message };
  }

  // Mark onboarding complete
  await supabase
    .from('vendor_profiles')
    .update({ onboarding_completed: true })
    .eq('id', vendorProfile.id);

  revalidatePath('/', 'layout');
  redirect('/dashboard');
}
