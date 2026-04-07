import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { TopBar } from './top-bar';

export async function DashHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const businessName = (user.user_metadata?.business_name as string) ?? '';

  return <TopBar email={user.email ?? ''} businessName={businessName} />;
}
