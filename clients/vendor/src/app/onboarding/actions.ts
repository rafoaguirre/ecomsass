'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { serverApi } from '@/lib/server-api-client';
import { ApiError } from '@ecomsaas/api-client';

export type OnboardingState = { error: string } | null;

export async function createStore(
  _prev: OnboardingState,
  formData: FormData
): Promise<OnboardingState> {
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

  try {
    await serverApi.post('/api/v1/onboarding/store', {
      name,
      slug,
      description: description || undefined,
      email: email || undefined,
      phoneNumber: phone || undefined,
      storeType: storeType || 'GENERAL',
      address: {
        street: street || '',
        city: city || '',
        province: province || '',
        country: country || '',
        postalCode: postalCode || '',
      },
    });
  } catch (err) {
    if (err instanceof ApiError && err.status === 409) {
      return { error: 'That store URL slug is already taken. Please choose another.' };
    }
    const message = err instanceof Error ? err.message : 'Failed to create store';
    return { error: message };
  }

  revalidatePath('/', 'layout');
  redirect('/dashboard');
}
