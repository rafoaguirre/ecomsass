'use server';

import { revalidatePath } from 'next/cache';
import { serverApi } from '@/lib/server-api-client';

export type SettingsState = { error?: string; success?: string } | null;

export async function updateStore(
  _prev: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  const storeId = formData.get('storeId') as string;

  if (!storeId) return { error: 'Store ID is required.' };

  const updates: Record<string, unknown> = {};

  const name = formData.get('name') as string;
  if (name) updates.name = name;

  const description = formData.get('description') as string;
  updates.description = description || undefined;

  const email = formData.get('email') as string;
  updates.email = email || undefined;

  const phone = formData.get('phone') as string;
  updates.phoneNumber = phone || undefined;

  const storeType = formData.get('storeType') as string;
  if (storeType) updates.storeType = storeType;

  const isActive = formData.get('isActive');
  updates.isActive = isActive === 'on';

  updates.address = {
    street: (formData.get('street') as string) || '',
    city: (formData.get('city') as string) || '',
    province: (formData.get('province') as string) || '',
    country: (formData.get('country') as string) || '',
    postalCode: (formData.get('postalCode') as string) || '',
  };

  try {
    await serverApi.put(`/api/v1/stores/${storeId}`, updates);
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed to update store.' };
  }

  revalidatePath('/dashboard/settings');
  return { success: 'Store settings updated.' };
}
