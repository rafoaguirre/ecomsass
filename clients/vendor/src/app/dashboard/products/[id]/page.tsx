import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getAuthUser } from '@/lib/auth';
import { ProductForm } from '../product-form';

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await getAuthUser();
  const supabase = await createClient();

  const { data: product } = await supabase.from('products').select('*').eq('id', id).single();

  if (!product) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Edit product</h1>
        <p className="text-sm text-gray-500">Update product details</p>
      </div>
      <ProductForm product={product} />
    </div>
  );
}
