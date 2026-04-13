'use server';

import { revalidatePath } from 'next/cache';
import { getStoreIdForAction } from '@/lib/auth';
import { serverApi } from '@/lib/server-api-client';

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

  try {
    await serverApi.put(`/api/v1/orders/${orderId}/status`, {
      status,
      ...(trackingNumber ? { trackingNumber } : {}),
      ...(carrier ? { carrier } : {}),
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed to update order status.' };
  }

  revalidatePath(`/dashboard/orders/${orderId}`);
  revalidatePath('/dashboard/orders');
  return { success: `Order status updated to ${status.replace(/_/g, ' ').toLowerCase()}.` };
}
