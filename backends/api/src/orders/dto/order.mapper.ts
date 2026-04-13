import type { OrderModel } from '@ecomsaas/domain';
import type { Money } from '@ecomsaas/domain';
import type { OrderResponse, OrderSummary, MoneyResponse } from '@ecomsaas/contracts';

function toMoneyResponse(money: Money): MoneyResponse {
  return { amount: money.amount.toString(), currency: money.currency };
}

function toOptionalMoneyResponse(money: Money | undefined): MoneyResponse | undefined {
  return money ? toMoneyResponse(money) : undefined;
}

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
    items: order.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      productName: item.productName,
      variantId: item.variantId,
      variantName: item.variantName,
      quantity: item.quantity,
      unitPrice: toMoneyResponse(item.unitPrice),
      subtotal: toMoneyResponse(item.subtotal),
      discount: toOptionalMoneyResponse(item.discount),
      total: toMoneyResponse(item.total),
      metadata: item.metadata,
    })),
    subtotal: toMoneyResponse(order.subtotal),
    tax: toOptionalMoneyResponse(order.tax),
    discount: toOptionalMoneyResponse(order.discount),
    deliveryFee: toOptionalMoneyResponse(order.deliveryFee),
    total: toMoneyResponse(order.total),
    payment: {
      method: order.payment.method,
      status: order.payment.status,
      amount: toMoneyResponse(order.payment.amount),
      transactionId: order.payment.transactionId,
      provider: order.payment.provider,
      providerPaymentId: order.payment.providerPaymentId,
      metadata: order.payment.metadata,
    },
    fulfillment: {
      type: order.fulfillment.type,
      address: order.fulfillment.address,
      scheduledFor: order.fulfillment.scheduledFor?.toISOString(),
      trackingNumber: order.fulfillment.trackingNumber,
      carrier: order.fulfillment.carrier,
      notes: order.fulfillment.notes,
    },
    notes: order.notes.map((n) => ({
      id: n.id,
      targetId: n.targetId,
      target: n.target,
      note: n.note,
      createdAt: n.createdAt.toISOString(),
    })),
    metadata: order.metadata,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
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
