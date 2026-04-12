import Link from 'next/link';
import {
  ShadcnBadge,
  ShadcnCard,
  ShadcnCardContent,
  ShadcnCardHeader,
  ShadcnCardTitle,
} from '@ecomsaas/ui/shadcn';
import { createClient } from '@/lib/supabase/server';
import { requireStoreId } from '@/lib/auth';
import { StatusFilter } from './status-filter';
import { ORDER_STATUS_CONFIG, formatMoney, formatDate } from './order-utils';

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function OrdersPage({ searchParams }: PageProps) {
  const storeId = await requireStoreId();
  const supabase = await createClient();
  const params = await searchParams;

  let query = supabase
    .from('orders')
    .select(
      'id, reference_id, status, total_amount, total_currency, created_at, user_id, profiles!inner(display_name, email)'
    )
    .eq('store_id', storeId)
    .order('created_at', { ascending: false })
    .limit(100);

  if (params.status) {
    query = query.eq('status', params.status);
  }

  const { data: orders } = await query;

  const items = (
    (orders ?? []) as unknown as Array<{
      id: string;
      reference_id: string;
      status: string;
      total_amount: number;
      total_currency: string;
      created_at: string;
      user_id: string;
      profiles: { display_name: string | null; email: string | null }[];
    }>
  ).map((o) => ({
    ...o,
    profile: o.profiles[0] ?? { display_name: null, email: null },
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Orders</h1>
          <p className="text-sm text-gray-500">Manage and fulfill customer orders</p>
        </div>
      </div>

      <StatusFilter currentStatus={params.status} />

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
                  d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              {params.status ? 'No matching orders' : 'No orders yet'}
            </h3>
            <p className="mt-1 max-w-sm text-sm text-gray-500">
              {params.status
                ? 'Try a different status filter or clear the filter to see all orders.'
                : 'When customers place orders at your store, they will appear here.'}
            </p>
          </ShadcnCardContent>
        </ShadcnCard>
      ) : (
        <ShadcnCard>
          <ShadcnCardHeader>
            <ShadcnCardTitle className="text-base">
              {items.length} order{items.length !== 1 ? 's' : ''}
            </ShadcnCardTitle>
          </ShadcnCardHeader>
          <ShadcnCardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-gray-500">
                    <th className="px-6 py-3 font-medium">Order</th>
                    <th className="px-6 py-3 font-medium">Customer</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 font-medium">Total</th>
                    <th className="px-6 py-3 font-medium">Date</th>
                    <th className="px-6 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">{order.reference_id}</p>
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {order.profile?.display_name || order.profile?.email || 'Unknown'}
                      </td>
                      <td className="px-6 py-4">
                        <ShadcnBadge
                          variant={ORDER_STATUS_CONFIG[order.status]?.variant ?? 'secondary'}
                        >
                          {ORDER_STATUS_CONFIG[order.status]?.label ?? order.status}
                        </ShadcnBadge>
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {formatMoney(order.total_amount, order.total_currency)}
                      </td>
                      <td className="px-6 py-4 text-gray-500">{formatDate(order.created_at)}</td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/dashboard/orders/${order.id}`}
                          className="text-sm font-medium text-brand-600 hover:text-brand-700"
                        >
                          View
                        </Link>
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
