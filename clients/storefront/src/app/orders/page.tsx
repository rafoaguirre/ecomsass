import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ShadcnBadge, ShadcnCard, ShadcnCardContent } from '@ecomsaas/ui/shadcn';
import { createClient } from '@/lib/supabase/server';
import { ORDER_STATUS_CONFIG, formatMoney, formatDate } from '@/lib/order-utils';

export default async function OrderHistoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: orders } = await supabase
    .from('orders')
    .select(
      'id, reference_id, status, total_amount, total_currency, created_at, store_id, stores!inner(name)'
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100);

  const items = (
    (orders ?? []) as unknown as Array<{
      id: string;
      reference_id: string;
      status: string;
      total_amount: number;
      total_currency: string;
      created_at: string;
      store_id: string;
      stores: { name: string } | { name: string }[];
    }>
  ).map((o) => {
    const store = Array.isArray(o.stores) ? o.stores[0] : o.stores;
    return {
      ...o,
      storeName: store?.name ?? 'Unknown Store',
    };
  });

  return (
    <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">My Orders</h1>
        <p className="mt-1 text-sm text-muted">View your order history and track your deliveries</p>
      </div>

      {items.length === 0 ? (
        <ShadcnCard>
          <ShadcnCardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 rounded-full bg-neutral-100 p-4">
              <svg
                className="h-8 w-8 text-neutral-400"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-foreground">No orders yet</h3>
            <p className="mt-1 max-w-sm text-sm text-muted">
              When you place orders, they will appear here.
            </p>
          </ShadcnCardContent>
        </ShadcnCard>
      ) : (
        <div className="space-y-4">
          {items.map((order) => {
            const cfg = ORDER_STATUS_CONFIG[order.status];
            return (
              <Link key={order.id} href={`/orders/${order.id}`} className="block">
                <ShadcnCard className="transition-shadow hover:shadow-md">
                  <ShadcnCardContent className="flex items-center justify-between p-5">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3">
                        <p className="font-medium text-foreground">{order.reference_id}</p>
                        <ShadcnBadge variant={cfg?.variant ?? 'secondary'}>
                          {cfg?.label ?? order.status}
                        </ShadcnBadge>
                      </div>
                      <p className="mt-1 text-sm text-muted">
                        {order.storeName} &middot; {formatDate(order.created_at)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">
                        {formatMoney(order.total_amount, order.total_currency)}
                      </p>
                      <svg
                        className="ml-auto mt-1 h-4 w-4 text-muted"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.5"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M8.25 4.5l7.5 7.5-7.5 7.5"
                        />
                      </svg>
                    </div>
                  </ShadcnCardContent>
                </ShadcnCard>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
