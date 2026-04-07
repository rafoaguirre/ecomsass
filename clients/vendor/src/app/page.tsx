import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getAuthUser } from '@/lib/auth';

export default async function RootPage() {
  const user = await getAuthUser();
  const supabase = await createClient();

  const { data: vendorProfile } = await supabase
    .from('vendor_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!vendorProfile) {
    redirect('/onboarding');
  }

  const { data: store } = await supabase
    .from('stores')
    .select('id')
    .eq('vendor_profile_id', vendorProfile.id)
    .limit(1)
    .single();

  if (!store) {
    redirect('/onboarding');
  }

  redirect('/dashboard');
}
