import type {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  FulfillmentType,
} from '@ecomsaas/domain/enums';
import type { Address } from '@ecomsaas/domain/value-objects';

/**
 * JSON-safe money representation (bigint serialized as string)
 */
export interface MoneyResponse {
  amount: string;
  currency: string;
}

/**
 * JSON-safe payment info (Money.amount serialized as string)
 */
export interface PaymentInfoResponse {
  method: PaymentMethod;
  status: PaymentStatus;
  amount: MoneyResponse;
  transactionId?: string;
  stripePaymentIntentId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * JSON-safe fulfillment info (Date serialized as ISO string)
 */
export interface FulfillmentInfoResponse {
  type: FulfillmentType;
  address?: Address;
  scheduledFor?: string;
  trackingNumber?: string;
  carrier?: string;
  notes?: string;
}

/**
 * JSON-safe order note (Date serialized as ISO string)
 */
export interface OrderNoteResponse {
  id: string;
  targetId: string;
  target: 'store' | 'buyer' | 'notification';
  note: string;
  createdAt: string;
}

/**
 * JSON-safe order item for API responses
 */
export interface OrderItemResponse {
  id: string;
  productId: string;
  productName: string;
  variantId?: string;
  variantName?: string;
  quantity: number;
  unitPrice: MoneyResponse;
  subtotal: MoneyResponse;
  discount?: MoneyResponse;
  total: MoneyResponse;
  metadata?: Record<string, unknown>;
}

/**
 * Order response with JSON-safe money fields
 */
export interface OrderResponse {
  id: string;
  storeId: string;
  userId: string;
  referenceId: string;
  status: OrderStatus;
  items: OrderItemResponse[];
  subtotal: MoneyResponse;
  tax?: MoneyResponse;
  discount?: MoneyResponse;
  deliveryFee?: MoneyResponse;
  total: MoneyResponse;
  payment: PaymentInfoResponse;
  fulfillment: FulfillmentInfoResponse;
  notes: OrderNoteResponse[];
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  storeName: string;
  customerName: string;
  itemCount: number;
}

/**
 * Order summary for lists
 */
export interface OrderSummary {
  id: string;
  referenceId: string;
  status: string;
  total: {
    amount: string;
    currency: string;
  };
  itemCount: number;
  createdAt: string;
}
