import Link from 'next/link';
import {
  ShadcnButton,
  ShadcnBadge,
  ShadcnCard,
  ShadcnCardContent,
  ShadcnCardHeader,
  ShadcnCardTitle,
} from '@ecomsaas/ui/shadcn';
import { createClient } from '@/lib/supabase/server';
import { requireStoreId } from '@/lib/auth';
import { DeleteButton } from './delete-button';

export default async function ProductsPage() {
  const storeId = await requireStoreId();
  const supabase = await createClient();

  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false });

  const items = products ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Products</h1>
          <p className="text-sm text-gray-500">Manage your product catalog</p>
        </div>
        <Link href="/dashboard/products/new">
          <ShadcnButton>
            <svg
              className="mr-2 h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add product
          </ShadcnButton>
        </Link>
      </div>

      {items.length === 0 ? (
        <ShadcnCard>
          <ShadcnCardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 rounded-full bg-gray-100 p-4">
              <svg
                className="h-8 w-8 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0-3-3m3 3 3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">No products yet</h3>
            <p className="mt-1 max-w-sm text-sm text-gray-500">
              Get started by adding your first product to your store.
            </p>
            <Link href="/dashboard/products/new" className="mt-6">
              <ShadcnButton>Add your first product</ShadcnButton>
            </Link>
          </ShadcnCardContent>
        </ShadcnCard>
      ) : (
        <ShadcnCard>
          <ShadcnCardHeader>
            <ShadcnCardTitle className="text-base">
              {items.length} product{items.length !== 1 ? 's' : ''}
            </ShadcnCardTitle>
          </ShadcnCardHeader>
          <ShadcnCardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-gray-500">
                    <th className="px-6 py-3 font-medium">Product</th>
                    <th className="px-6 py-3 font-medium">Price</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 font-medium">Availability</th>
                    <th className="px-6 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{product.name}</p>
                          {product.description && (
                            <p className="mt-0.5 line-clamp-1 text-xs text-gray-500">
                              {product.description}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {(product.price_amount / 100).toLocaleString('en-US', {
                          style: 'currency',
                          currency: product.price_currency || 'USD',
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <ShadcnBadge variant={product.is_active ? 'success' : 'secondary'}>
                          {product.is_active ? 'Active' : 'Inactive'}
                        </ShadcnBadge>
                      </td>
                      <td className="px-6 py-4">
                        <ShadcnBadge
                          variant={
                            product.availability === 'AVAILABLE'
                              ? 'success'
                              : product.availability === 'COMING_SOON'
                                ? 'warning'
                                : 'danger'
                          }
                        >
                          {product.availability.replace(/_/g, ' ')}
                        </ShadcnBadge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/dashboard/products/${product.id}`}>
                            <ShadcnButton variant="ghost" size="sm">
                              Edit
                            </ShadcnButton>
                          </Link>
                          <DeleteButton productId={product.id} productName={product.name} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ShadcnCardContent>
        </ShadcnCard>
      )}
    </div>
  );
}
