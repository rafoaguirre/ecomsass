'use server';

import { revalidatePath } from 'next/cache';
import { getStoreIdForAction } from '@/lib/auth';
import { serverApi } from '@/lib/server-api-client';
import { parsePriceToCents, parseTags } from '@/lib/product-utils';

export type ProductState = { error?: string; success?: string } | null;

export async function createProduct(
  _prev: ProductState,
  formData: FormData
): Promise<ProductState> {
  const result = await getStoreIdForAction();
  if ('error' in result) return { error: result.error };

  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const priceStr = formData.get('price') as string;
  const currency = (formData.get('currency') as string) || 'USD';
  const availability = (formData.get('availability') as string) || 'AVAILABLE';
  const tagsRaw = formData.get('tags') as string;

  const priceAmount = parsePriceToCents(priceStr);
  if (isNaN(priceAmount) || priceAmount <= 0) {
    return { error: 'Price must be greater than 0.' };
  }

  try {
    await serverApi.post('/api/v1/products', {
      storeId: result.storeId,
      name,
      description: description || undefined,
      price: { amount: priceAmount, currency },
      availability,
      tags: parseTags(tagsRaw),
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed to create product.' };
  }

  revalidatePath('/dashboard/products');
  return { success: 'Product created successfully.' };
}

export async function updateProduct(
  _prev: ProductState,
  formData: FormData
): Promise<ProductState> {
  const result = await getStoreIdForAction();
  if ('error' in result) return { error: result.error };

  const productId = formData.get('productId') as string;
  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const priceStr = formData.get('price') as string;
  const currency = (formData.get('currency') as string) || 'USD';
  const availability = (formData.get('availability') as string) || 'AVAILABLE';
  const isActive = formData.get('isActive') === 'on';
  const tagsRaw = formData.get('tags') as string;

  const priceAmount = parsePriceToCents(priceStr);
  if (isNaN(priceAmount) || priceAmount <= 0) {
    return { error: 'Price must be greater than 0.' };
  }

  try {
    await serverApi.put(`/api/v1/products/${productId}`, {
      name,
      description: description || undefined,
      price: { amount: priceAmount, currency },
      availability,
      tags: parseTags(tagsRaw),
      metadata: { isActive },
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed to update product.' };
  }

  revalidatePath('/dashboard/products');
  return { success: 'Product updated.' };
}

export async function deleteProduct(productId: string): Promise<ProductState> {
  const result = await getStoreIdForAction();
  if ('error' in result) return { error: result.error };

  try {
    await serverApi.delete(`/api/v1/products/${productId}`);
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed to delete product.' };
  }

  revalidatePath('/dashboard/products');
  return { success: 'Product deleted.' };
}
