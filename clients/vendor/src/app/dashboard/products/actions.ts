'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getStoreIdForAction } from '@/lib/auth';
import { parsePriceToCents, parseTags } from '@/lib/product-utils';

export type ProductState = { error?: string; success?: string } | null;

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

export async function createProduct(
  _prev: ProductState,
  formData: FormData
): Promise<ProductState> {
  const result = await getStoreIdForAction();
  if ('error' in result) return { error: result.error };

  const supabase = await createClient();
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

  const slug = slugify(name);

  const { error } = await supabase.from('products').insert({
    store_id: result.storeId,
    name,
    slug,
    description: description || null,
    price_amount: priceAmount,
    price_currency: currency,
    availability,
    tags: parseTags(tagsRaw),
  });

  if (error) {
    if (error.code === '23505') {
      return { error: 'A product with that name already exists in your store.' };
    }
    return { error: error.message };
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

  const supabase = await createClient();
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

  const { error } = await supabase
    .from('products')
    .update({
      name,
      description: description || null,
      price_amount: priceAmount,
      price_currency: currency,
      availability,
      is_active: isActive,
      tags: parseTags(tagsRaw),
    })
    .eq('id', productId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dashboard/products');
  return { success: 'Product updated.' };
}

export async function deleteProduct(productId: string): Promise<ProductState> {
  const result = await getStoreIdForAction();
  if ('error' in result) return { error: result.error };

  const supabase = await createClient();
  const { error } = await supabase.from('products').delete().eq('id', productId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dashboard/products');
  return { success: 'Product deleted.' };
}
