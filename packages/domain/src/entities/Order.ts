import type { OrderStatus, PaymentStatus, PaymentMethod, FulfillmentType } from '../enums';
import type { Money, Address } from '../value-objects';

/**
 * Order note
 */
export interface OrderNote {
  id: string;
  targetId: string;
  target: 'store' | 'buyer' | 'notification';
  note: string;
  createdAt: Date;
}

/**
 * Payment information
 */
export interface PaymentInfo {
  method: PaymentMethod;
  status: PaymentStatus;
  amount: Money;
  transactionId?: string;
  stripePaymentIntentId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Fulfillment information
 */
export interface FulfillmentInfo {
  type: FulfillmentType;
  address?: Address;
  scheduledFor?: Date;
  trackingNumber?: string;
  carrier?: string;
  notes?: string;
}

/**
 * Order entity
 */
export interface Order {
  id: string;
  storeId: string;
  userId: string;
  referenceId: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: Money;
  tax?: Money;
  discount?: Money;
  deliveryFee?: Money;
  total: Money;
  payment: PaymentInfo;
  fulfillment: FulfillmentInfo;
  notes: OrderNote[];
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Order item (line item)
 */
export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  variantId?: string;
  variantName?: string;
  quantity: number;
  unitPrice: Money;
  subtotal: Money;
  discount?: Money;
  total: Money;
  metadata?: Record<string, unknown>;
}
