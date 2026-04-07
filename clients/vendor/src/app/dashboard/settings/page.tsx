import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireStoreId } from '@/lib/auth';
import { SettingsForm } from './settings-form';

export default async function SettingsPage() {
  const storeId = await requireStoreId();
  const supabase = await createClient();

  const { data: store } = await supabase.from('stores').select('*').eq('id', storeId).single();

  if (!store) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Store Settings</h1>
        <p className="mt-1 text-sm text-muted">Manage your store details and preferences.</p>
      </div>
      <SettingsForm store={store} />
    </div>
  );
}
