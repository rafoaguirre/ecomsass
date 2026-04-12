import Link from 'next/link';
import { notFound } from 'next/navigation';
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
import { requireStoreId } from '@/lib/auth';
import { OrderStatusActions } from './order-status-actions';
import { ORDER_STATUS_CONFIG, formatMoney, formatDateTime, formatAddress } from '../order-utils';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: PageProps) {
  const { id } = await params;
  const storeId = await requireStoreId();
  const supabase = await createClient();

  const { data: order } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('id', id)
    .eq('store_id', storeId)
    .single();

  if (!order) notFound();

  const customer = { display_name: null, email: null } as {
    display_name: string | null;
    email: string | null;
  };
  const items = (order.order_items ?? []) as Array<{
    id: string;
    product_name: string;
    variant_name: string | null;
    quantity: number;
    unit_price_amount: number;
    unit_price_currency: string;
    subtotal_amount: number;
    subtotal_currency: string;
    discount_amount: number | null;
    discount_currency: string | null;
    total_amount: number;
    total_currency: string;
  }>;

  const payment = (order.payment ?? {}) as {
    method?: string;
    status?: string;
    transactionId?: string;
    stripePaymentIntentId?: string;
  };

  const fulfillment = (order.fulfillment ?? {}) as {
    type?: string;
    trackingNumber?: string;
    carrier?: string;
    notes?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      zip?: string;
      country?: string;
    };
  };

  const notes = (order.notes ?? []) as Array<{
    id: string;
    note: string;
    target: string;
    createdAt: string;
  }>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/dashboard/orders"
          className="mb-2 inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
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
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Order {order.reference_id}
          </h1>
          <ShadcnBadge variant={ORDER_STATUS_CONFIG[order.status]?.variant ?? 'secondary'}>
            {ORDER_STATUS_CONFIG[order.status]?.label ?? order.status}
          </ShadcnBadge>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          Placed on {formatDateTime(order.created_at)}
          {order.updated_at !== order.created_at && (
            <> &middot; Last updated {formatDateTime(order.updated_at)}</>
          )}
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
                    <tr className="border-b border-gray-200 text-left text-gray-500">
                      <th className="px-6 py-3 font-medium">Product</th>
                      <th className="px-6 py-3 font-medium text-right">Qty</th>
                      <th className="px-6 py-3 font-medium text-right">Unit Price</th>
                      <th className="px-6 py-3 font-medium text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-900">{item.product_name}</p>
                          {item.variant_name && (
                            <p className="text-xs text-gray-500">{item.variant_name}</p>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right text-gray-700">{item.quantity}</td>
                        <td className="px-6 py-4 text-right text-gray-700">
                          {formatMoney(item.unit_price_amount, item.unit_price_currency)}
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-gray-900">
                          {formatMoney(item.total_amount, item.total_currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ShadcnCardContent>
          </ShadcnCard>

          {/* Order Totals */}
          <ShadcnCard>
            <ShadcnCardHeader>
              <ShadcnCardTitle className="text-base">Order Summary</ShadcnCardTitle>
            </ShadcnCardHeader>
            <ShadcnCardContent>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-500">Subtotal</dt>
                  <dd className="text-gray-900">
                    {formatMoney(order.subtotal_amount, order.subtotal_currency)}
                  </dd>
                </div>
                {order.tax_amount != null && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Tax</dt>
                    <dd className="text-gray-900">
                      {formatMoney(order.tax_amount, order.tax_currency)}
                    </dd>
                  </div>
                )}
                {order.discount_amount != null && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Discount</dt>
                    <dd className="text-green-600">
                      -{formatMoney(order.discount_amount, order.discount_currency)}
                    </dd>
                  </div>
                )}
                {order.delivery_fee_amount != null && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Delivery Fee</dt>
                    <dd className="text-gray-900">
                      {formatMoney(order.delivery_fee_amount, order.delivery_fee_currency)}
                    </dd>
                  </div>
                )}
                <ShadcnSeparator />
                <div className="flex justify-between font-medium">
                  <dt className="text-gray-900">Total</dt>
                  <dd className="text-gray-900">
                    {formatMoney(order.total_amount, order.total_currency)}
                  </dd>
                </div>
              </dl>
            </ShadcnCardContent>
          </ShadcnCard>

          {/* Notes */}
          {notes.length > 0 && (
            <ShadcnCard>
              <ShadcnCardHeader>
                <ShadcnCardTitle className="text-base">Notes</ShadcnCardTitle>
              </ShadcnCardHeader>
              <ShadcnCardContent>
                <ul className="space-y-3">
                  {notes.map((note, i) => (
                    <li key={note.id ?? i} className="text-sm">
                      <p className="text-gray-900">{note.note}</p>
                      <p className="mt-0.5 text-xs text-gray-400">
                        {note.target} &middot; {formatDateTime(note.createdAt)}
                      </p>
                    </li>
                  ))}
                </ul>
              </ShadcnCardContent>
            </ShadcnCard>
          )}
        </div>

        {/* Sidebar — 1 col */}
        <div className="space-y-6">
          {/* Status Actions */}
          <ShadcnCard>
            <ShadcnCardHeader>
              <ShadcnCardTitle className="text-base">Actions</ShadcnCardTitle>
            </ShadcnCardHeader>
            <ShadcnCardContent className="space-y-3">
              <OrderStatusActions orderId={order.id} currentStatus={order.status} />
              <Link href={`/dashboard/orders/${order.id}/packing-slip`}>
                <ShadcnButton variant="secondary" className="mt-3 w-full">
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
                      d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z"
                    />
                  </svg>
                  Print Packing Slip
                </ShadcnButton>
              </Link>
            </ShadcnCardContent>
          </ShadcnCard>

          {/* Customer Info */}
          <ShadcnCard>
            <ShadcnCardHeader>
              <ShadcnCardTitle className="text-base">Customer</ShadcnCardTitle>
            </ShadcnCardHeader>
            <ShadcnCardContent>
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="text-gray-500">Name</dt>
                  <dd className="text-gray-900">{customer.display_name || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Email</dt>
                  <dd className="text-gray-900">{customer.email || 'N/A'}</dd>
                </div>
              </dl>
            </ShadcnCardContent>
          </ShadcnCard>

          {/* Payment Info */}
          <ShadcnCard>
            <ShadcnCardHeader>
              <ShadcnCardTitle className="text-base">Payment</ShadcnCardTitle>
            </ShadcnCardHeader>
            <ShadcnCardContent>
              <dl className="space-y-2 text-sm">
                {payment.method && (
                  <div>
                    <dt className="text-gray-500">Method</dt>
                    <dd className="text-gray-900">{payment.method}</dd>
                  </div>
                )}
                {payment.status && (
                  <div>
                    <dt className="text-gray-500">Status</dt>
                    <dd className="text-gray-900">{payment.status}</dd>
                  </div>
                )}
                {payment.transactionId && (
                  <div>
                    <dt className="text-gray-500">Transaction ID</dt>
                    <dd className="break-all text-gray-900">{payment.transactionId}</dd>
                  </div>
                )}
              </dl>
            </ShadcnCardContent>
          </ShadcnCard>

          {/* Fulfillment Info */}
          <ShadcnCard>
            <ShadcnCardHeader>
              <ShadcnCardTitle className="text-base">Fulfillment</ShadcnCardTitle>
            </ShadcnCardHeader>
            <ShadcnCardContent>
              <dl className="space-y-2 text-sm">
                {fulfillment.type && (
                  <div>
                    <dt className="text-gray-500">Type</dt>
                    <dd className="text-gray-900">{fulfillment.type}</dd>
                  </div>
                )}
                {fulfillment.trackingNumber && (
                  <div>
                    <dt className="text-gray-500">Tracking Number</dt>
                    <dd className="text-gray-900">{fulfillment.trackingNumber}</dd>
                  </div>
                )}
                {fulfillment.carrier && (
                  <div>
                    <dt className="text-gray-500">Carrier</dt>
                    <dd className="text-gray-900">{fulfillment.carrier}</dd>
                  </div>
                )}
                {fulfillment.address && (
                  <div>
                    <dt className="text-gray-500">Address</dt>
                    <dd className="text-gray-900">{formatAddress(fulfillment.address)}</dd>
                  </div>
                )}
                {fulfillment.notes && (
                  <div>
                    <dt className="text-gray-500">Notes</dt>
                    <dd className="text-gray-900">{fulfillment.notes}</dd>
                  </div>
                )}
              </dl>
            </ShadcnCardContent>
          </ShadcnCard>
        </div>
      </div>
    </div>
  );
}
