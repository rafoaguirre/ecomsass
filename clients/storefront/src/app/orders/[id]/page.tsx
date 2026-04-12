import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import {
  ShadcnBadge,
  ShadcnButton,
  ShadcnCard,
  ShadcnCardContent,
  ShadcnCardHeader,
  ShadcnCardTitle,
  ShadcnSeparator,
} from '@ecomsaas/ui/shadcn';
import { createClient } from '@/lib/supabase/server';
import { ORDER_STATUS_CONFIG, formatMoney, formatDateTime, formatAddress } from '@/lib/order-utils';
import { OrderTimeline } from './order-timeline';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CustomerOrderDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: order } = await supabase
    .from('orders')
    .select('*, order_items(*), stores(name, email, address)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!order) notFound();

  const storeRaw = order.stores as unknown as
    | { name: string; email: string | null; address: Record<string, string> }
    | { name: string; email: string | null; address: Record<string, string> }[];
  const store = Array.isArray(storeRaw)
    ? (storeRaw[0] ?? { name: 'Unknown', email: null, address: {} })
    : (storeRaw ?? { name: 'Unknown', email: null, address: {} });

  const items = (order.order_items ?? []) as Array<{
    id: string;
    product_name: string;
    variant_name: string | null;
    quantity: number;
    unit_price_amount: number;
    unit_price_currency: string;
    total_amount: number;
    total_currency: string;
  }>;

  const fulfillment = (order.fulfillment ?? {}) as {
    type?: string;
    trackingNumber?: string;
    carrier?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      zip?: string;
      country?: string;
    };
  };

  const cfg = ORDER_STATUS_CONFIG[order.status];

  return (
    <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/orders"
          className="mb-2 inline-flex items-center text-sm text-muted hover:text-foreground"
        >
          <svg
            className="mr-1 h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back to Orders
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="font-display text-2xl font-bold text-foreground">
            Order {order.reference_id}
          </h1>
          <ShadcnBadge variant={cfg?.variant ?? 'secondary'}>
            {cfg?.label ?? order.status}
          </ShadcnBadge>
        </div>
        <p className="mt-1 text-sm text-muted">
          Placed on {formatDateTime(order.created_at)} &middot; {store.name}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content — 2 cols */}
        <div className="space-y-6 lg:col-span-2">
          {/* Order Items */}
          <ShadcnCard>
            <ShadcnCardHeader>
              <ShadcnCardTitle className="text-base">Items ({items.length})</ShadcnCardTitle>
            </ShadcnCardHeader>
            <ShadcnCardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-200 text-left text-muted">
                      <th className="px-6 py-3 font-medium">Product</th>
                      <th className="px-6 py-3 font-medium text-right">Qty</th>
                      <th className="px-6 py-3 font-medium text-right">Unit Price</th>
                      <th className="px-6 py-3 font-medium text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-6 py-4">
                          <p className="font-medium text-foreground">{item.product_name}</p>
                          {item.variant_name && (
                            <p className="text-xs text-muted">{item.variant_name}</p>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">{item.quantity}</td>
                        <td className="px-6 py-4 text-right">
                          {formatMoney(item.unit_price_amount, item.unit_price_currency)}
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-foreground">
                          {formatMoney(item.total_amount, item.total_currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ShadcnCardContent>
          </ShadcnCard>

          {/* Order Summary */}
          <ShadcnCard>
            <ShadcnCardHeader>
              <ShadcnCardTitle className="text-base">Order Summary</ShadcnCardTitle>
            </ShadcnCardHeader>
            <ShadcnCardContent>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted">Subtotal</dt>
                  <dd className="text-foreground">
                    {formatMoney(order.subtotal_amount, order.subtotal_currency)}
                  </dd>
                </div>
                {order.tax_amount != null && (
                  <div className="flex justify-between">
                    <dt className="text-muted">Tax</dt>
                    <dd className="text-foreground">
                      {formatMoney(order.tax_amount, order.tax_currency)}
                    </dd>
                  </div>
                )}
                {order.discount_amount != null && (
                  <div className="flex justify-between">
                    <dt className="text-muted">Discount</dt>
                    <dd className="text-green-600">
                      -{formatMoney(order.discount_amount, order.discount_currency)}
                    </dd>
                  </div>
                )}
                {order.delivery_fee_amount != null && (
                  <div className="flex justify-between">
                    <dt className="text-muted">Delivery Fee</dt>
                    <dd className="text-foreground">
                      {formatMoney(order.delivery_fee_amount, order.delivery_fee_currency)}
                    </dd>
                  </div>
                )}
                <ShadcnSeparator />
                <div className="flex justify-between font-medium">
                  <dt className="text-foreground">Total</dt>
                  <dd className="text-foreground">
                    {formatMoney(order.total_amount, order.total_currency)}
                  </dd>
                </div>
              </dl>
            </ShadcnCardContent>
          </ShadcnCard>

          {/* Shipping / Fulfillment info */}
          {(fulfillment.trackingNumber || fulfillment.address) && (
            <ShadcnCard>
              <ShadcnCardHeader>
                <ShadcnCardTitle className="text-base">Shipping</ShadcnCardTitle>
              </ShadcnCardHeader>
              <ShadcnCardContent>
                <dl className="space-y-2 text-sm">
                  {fulfillment.type && (
                    <div>
                      <dt className="text-muted">Type</dt>
                      <dd className="text-foreground">{fulfillment.type}</dd>
                    </div>
                  )}
                  {fulfillment.trackingNumber && (
                    <div>
                      <dt className="text-muted">Tracking Number</dt>
                      <dd className="font-mono text-foreground">{fulfillment.trackingNumber}</dd>
                    </div>
                  )}
                  {fulfillment.carrier && (
                    <div>
                      <dt className="text-muted">Carrier</dt>
                      <dd className="text-foreground">{fulfillment.carrier}</dd>
                    </div>
                  )}
                  {fulfillment.address && (
                    <div>
                      <dt className="text-muted">Shipping Address</dt>
                      <dd className="text-foreground">{formatAddress(fulfillment.address)}</dd>
                    </div>
                  )}
                </dl>
              </ShadcnCardContent>
            </ShadcnCard>
          )}
        </div>

        {/* Sidebar — 1 col */}
        <div className="space-y-6">
          {/* Order Tracking Timeline */}
          <ShadcnCard>
            <ShadcnCardHeader>
              <ShadcnCardTitle className="text-base">Order Tracking</ShadcnCardTitle>
            </ShadcnCardHeader>
            <ShadcnCardContent>
              <OrderTimeline
                currentStatus={order.status}
                createdAt={order.created_at}
                updatedAt={order.updated_at}
              />
            </ShadcnCardContent>
          </ShadcnCard>

          {/* Store Info */}
          <ShadcnCard>
            <ShadcnCardHeader>
              <ShadcnCardTitle className="text-base">Store</ShadcnCardTitle>
            </ShadcnCardHeader>
            <ShadcnCardContent>
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="text-muted">Name</dt>
                  <dd className="text-foreground">{store.name}</dd>
                </div>
                {store.email && (
                  <div>
                    <dt className="text-muted">Email</dt>
                    <dd className="text-foreground">{store.email}</dd>
                  </div>
                )}
              </dl>
            </ShadcnCardContent>
          </ShadcnCard>

          {/* Actions */}
          <ShadcnCard>
            <ShadcnCardContent className="p-5">
              <Link href={`/orders/${order.id}/invoice`}>
                <ShadcnButton variant="secondary" className="w-full">
                  <svg
                    className="mr-2 h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                    />
                  </svg>
                  Download Invoice
                </ShadcnButton>
              </Link>
            </ShadcnCardContent>
          </ShadcnCard>
        </div>
      </div>
    </section>
  );
}
