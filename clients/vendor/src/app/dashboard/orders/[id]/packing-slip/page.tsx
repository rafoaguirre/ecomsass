import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireStoreId } from '@/lib/auth';
import { formatDate, formatAddress } from '../../order-utils';
import { PrintButton } from './print-button';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PackingSlipPage({ params }: PageProps) {
  const { id } = await params;
  const storeId = await requireStoreId();
  const supabase = await createClient();

  const { data: order } = await supabase
    .from('orders')
    .select('*, order_items(*), stores!inner(name, email, address)')
    .eq('id', id)
    .eq('store_id', storeId)
    .single();

  if (!order) notFound();

  const customer = { display_name: null, email: null } as {
    display_name: string | null;
    email: string | null;
  };

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
  }>;

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

  const storeAddress = formatAddress(store.address);

  const shipAddress = formatAddress(fulfillment.address);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 print:max-w-none print:px-0 print:py-0">
      {/* Actions — hidden on print */}
      <div className="mb-6 flex items-center justify-between print:hidden">
        <Link
          href={`/dashboard/orders/${id}`}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
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

      {/* Packing Slip document */}
      <div className="rounded-lg border border-gray-200 bg-white p-8 print:rounded-none print:border-0 print:p-0">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">PACKING SLIP</h1>
            <p className="mt-1 text-sm text-gray-500">Order #{order.reference_id}</p>
            <p className="text-sm text-gray-500">{formatDate(order.created_at)}</p>
          </div>
          <div className="text-right text-sm">
            <p className="font-semibold text-gray-900">{store.name}</p>
            {store.email && <p className="text-gray-500">{store.email}</p>}
            {storeAddress && <p className="text-gray-500">{storeAddress}</p>}
          </div>
        </div>

        <hr className="my-6 border-gray-200" />

        {/* Ship To / Customer */}
        <div className="grid grid-cols-2 gap-6 text-sm">
          <div>
            <p className="font-semibold text-gray-500">Ship To</p>
            <p className="mt-1 font-medium text-gray-900">
              {customer.display_name || customer.email || 'N/A'}
            </p>
            {shipAddress && <p className="text-gray-700">{shipAddress}</p>}
          </div>
          <div>
            <p className="font-semibold text-gray-500">Shipping Details</p>
            {fulfillment.type && <p className="mt-1 text-gray-700">Method: {fulfillment.type}</p>}
            {fulfillment.carrier && <p className="text-gray-700">Carrier: {fulfillment.carrier}</p>}
            {fulfillment.trackingNumber && (
              <p className="font-mono text-gray-700">Tracking: {fulfillment.trackingNumber}</p>
            )}
          </div>
        </div>

        {/* Items table — NO prices */}
        <table className="mt-8 w-full text-sm">
          <thead>
            <tr className="border-b-2 border-gray-300 text-left">
              <th className="pb-2 font-semibold text-gray-900">Item</th>
              <th className="pb-2 text-right font-semibold text-gray-900">Qty</th>
              <th className="pb-2 text-center font-semibold text-gray-900">Packed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((item) => (
              <tr key={item.id}>
                <td className="py-3">
                  <p className="text-gray-900">{item.product_name}</p>
                  {item.variant_name && (
                    <p className="text-xs text-gray-500">{item.variant_name}</p>
                  )}
                </td>
                <td className="py-3 text-right font-medium">{item.quantity}</td>
                <td className="py-3 text-center">
                  {/* Checkbox for warehouse staff to tick off */}
                  <span className="inline-block h-5 w-5 rounded border-2 border-gray-400" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Total items summary */}
        <div className="mt-6 border-t-2 border-gray-300 pt-3 text-sm">
          <p className="font-medium text-gray-900">
            Total Items: {items.reduce((sum, i) => sum + i.quantity, 0)}
          </p>
        </div>

        {/* Notes */}
        {fulfillment.notes && (
          <div className="mt-6 rounded border border-gray-200 bg-gray-50 p-4 text-sm">
            <p className="font-semibold text-gray-700">Notes</p>
            <p className="mt-1 text-gray-600">{fulfillment.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
