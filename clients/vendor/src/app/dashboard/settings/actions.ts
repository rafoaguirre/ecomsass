'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export type SettingsState = { error?: string; success?: string } | null;

export async function updateStore(
  _prev: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Not authenticated.' };

  const storeId = formData.get('storeId') as string;

  const updates: Record<string, unknown> = {};

  const name = formData.get('name') as string;
  if (name) updates.name = name;

  const description = formData.get('description') as string;
  updates.description = description || null;

  const email = formData.get('email') as string;
  updates.email = email || null;

  const phone = formData.get('phone') as string;
  updates.phone_number = phone || null;

  const storeType = formData.get('storeType') as string;
  if (storeType) updates.store_type = storeType;

  const isActive = formData.get('isActive');
  updates.is_active = isActive === 'on';

  updates.address = {
    street: (formData.get('street') as string) || '',
    city: (formData.get('city') as string) || '',
    province: (formData.get('province') as string) || '',
    country: (formData.get('country') as string) || '',
    postalCode: (formData.get('postalCode') as string) || '',
  };

  const { error } = await supabase.from('stores').update(updates).eq('id', storeId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dashboard/settings');
  return { success: 'Store settings updated.' };
}
