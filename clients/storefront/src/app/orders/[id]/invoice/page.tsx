import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { formatMoney, formatDate, formatAddress } from '@/lib/order-utils';
import { PrintButton } from '@/components/print-button';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function InvoicePage({ params }: PageProps) {
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
    address?: {
      street?: string;
      city?: string;
      state?: string;
      zip?: string;
      country?: string;
    };
  };

  const storeAddress = formatAddress(store.address);

  const shipAddress = formatAddress(fulfillment.address);

  return (
    <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6 print:max-w-none print:px-0 print:py-0">
      {/* Actions — hidden on print */}
      <div className="mb-6 flex items-center justify-between print:hidden">
        <Link
          href={`/orders/${id}`}
          className="inline-flex items-center text-sm text-muted hover:text-foreground"
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
          Back to Order
        </Link>
        <PrintButton />
      </div>

      {/* Invoice document */}
      <div className="rounded-lg border border-neutral-200 bg-white p-8 print:rounded-none print:border-0 print:p-0">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">INVOICE</h1>
            <p className="mt-1 text-sm text-muted">#{order.reference_id}</p>
          </div>
          <div className="text-right text-sm">
            <p className="font-semibold text-foreground">{store.name}</p>
            {store.email && <p className="text-muted">{store.email}</p>}
            {storeAddress && <p className="text-muted">{storeAddress}</p>}
          </div>
        </div>

        <hr className="my-6 border-neutral-200" />

        {/* Bill To / Ship To / Date */}
        <div className="grid grid-cols-3 gap-6 text-sm">
          <div>
            <p className="font-semibold text-muted">Bill To</p>
            <p className="mt-1 text-foreground">{user.email}</p>
          </div>
          {shipAddress && (
            <div>
              <p className="font-semibold text-muted">Ship To</p>
              <p className="mt-1 text-foreground">{shipAddress}</p>
            </div>
          )}
          <div className="text-right">
            <p className="font-semibold text-muted">Date</p>
            <p className="mt-1 text-foreground">{formatDate(order.created_at)}</p>
          </div>
        </div>

        {/* Items table */}
        <table className="mt-8 w-full text-sm">
          <thead>
            <tr className="border-b-2 border-neutral-300 text-left">
              <th className="pb-2 font-semibold text-foreground">Item</th>
              <th className="pb-2 text-right font-semibold text-foreground">Qty</th>
              <th className="pb-2 text-right font-semibold text-foreground">Unit Price</th>
              <th className="pb-2 text-right font-semibold text-foreground">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {items.map((item) => (
              <tr key={item.id}>
                <td className="py-3">
                  <p className="text-foreground">{item.product_name}</p>
                  {item.variant_name && <p className="text-xs text-muted">{item.variant_name}</p>}
                </td>
                <td className="py-3 text-right">{item.quantity}</td>
                <td className="py-3 text-right">
                  {formatMoney(item.unit_price_amount, item.unit_price_currency)}
                </td>
                <td className="py-3 text-right font-medium">
                  {formatMoney(item.total_amount, item.total_currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="mt-6 flex justify-end">
          <dl className="w-64 space-y-1 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Subtotal</dt>
              <dd>{formatMoney(order.subtotal_amount, order.subtotal_currency)}</dd>
            </div>
            {order.tax_amount != null && (
              <div className="flex justify-between">
                <dt className="text-muted">Tax</dt>
                <dd>{formatMoney(order.tax_amount, order.tax_currency)}</dd>
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
                <dd>{formatMoney(order.delivery_fee_amount, order.delivery_fee_currency)}</dd>
              </div>
            )}
            <hr className="border-neutral-200" />
            <div className="flex justify-between text-base font-bold">
              <dt>Total</dt>
              <dd>{formatMoney(order.total_amount, order.total_currency)}</dd>
            </div>
          </dl>
        </div>

        {/* Footer */}
        <p className="mt-10 text-center text-xs text-muted">Thank you for your purchase!</p>
      </div>
    </section>
  );
}
