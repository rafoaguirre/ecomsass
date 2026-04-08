import type { OrderModel } from '@ecomsaas/domain';
import type { OrderResponse, OrderSummary } from '@ecomsaas/contracts';

export function toOrderResponse(
  order: OrderModel,
  storeName: string,
  customerName: string
): OrderResponse {
  return {
    id: order.id,
    storeId: order.storeId,
    userId: order.userId,
    referenceId: order.referenceId,
    status: order.status,
    items: order.items,
    subtotal: order.subtotal,
    tax: order.tax,
    discount: order.discount,
    deliveryFee: order.deliveryFee,
    total: order.total,
    payment: order.payment,
    fulfillment: order.fulfillment,
    notes: order.notes,
    metadata: order.metadata,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    storeName,
    customerName,
    itemCount: order.itemCount(),
  };
}

export function toOrderSummary(order: OrderModel): OrderSummary {
  return {
    id: order.id,
    referenceId: order.referenceId,
    status: order.status,
    total: {
      amount: order.total.amount.toString(),
      currency: order.total.currency,
    },
    itemCount: order.itemCount(),
    createdAt: order.createdAt.toISOString(),
  };
}
