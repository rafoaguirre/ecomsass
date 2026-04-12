'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getStoreIdForAction } from '@/lib/auth';

export type OrderActionState = { error?: string; success?: string } | null;

export async function updateOrderStatus(
  _prev: OrderActionState,
  formData: FormData
): Promise<OrderActionState> {
  const result = await getStoreIdForAction();
  if ('error' in result) return { error: result.error };

  const orderId = formData.get('orderId') as string;
  const status = formData.get('status') as string;
  const trackingNumber = formData.get('trackingNumber') as string | null;
  const carrier = formData.get('carrier') as string | null;

  if (!orderId || !status) {
    return { error: 'Missing required fields.' };
  }

  const supabase = await createClient();

  // Verify the order belongs to the vendor's store
  const { data: order } = await supabase
    .from('orders')
    .select('id, store_id, fulfillment')
    .eq('id', orderId)
    .eq('store_id', result.storeId)
    .single();

  if (!order) {
    return { error: 'Order not found.' };
  }

  // Build update payload
  const update: Record<string, unknown> = { status };

  // For shipping transitions, merge tracking info into fulfillment JSONB
  if (status === 'IN_TRANSIT' && (trackingNumber || carrier)) {
    const fulfillment =
      typeof order.fulfillment === 'object' && order.fulfillment !== null
        ? (order.fulfillment as Record<string, unknown>)
        : {};
    update.fulfillment = {
      ...fulfillment,
      ...(trackingNumber ? { trackingNumber } : {}),
      ...(carrier ? { carrier } : {}),
    };
  }

  const { error } = await supabase
    .from('orders')
    .update(update)
    .eq('id', orderId)
    .eq('store_id', result.storeId);

  if (error) {
    // The DB trigger will reject invalid transitions with a descriptive message
    return { error: error.message };
  }

  revalidatePath(`/dashboard/orders/${orderId}`);
  revalidatePath('/dashboard/orders');
  return { success: `Order status updated to ${status.replace(/_/g, ' ').toLowerCase()}.` };
}
