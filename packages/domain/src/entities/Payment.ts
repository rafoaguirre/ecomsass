import type { PaymentMethod, PaymentStatus } from '../enums';
import type { Money } from '../value-objects';

/**
 * Payment entity — represents a single payment attempt or event.
 *
 * The orders.payment JSONB remains as a denormalized summary;
 * this entity is the source of truth for payment history, refunds,
 * retries, and multi-provider support.
 */
export interface Payment {
  id: string;
  orderId: string;
  storeId: string;
  provider: string;
  providerPaymentId?: string;
  providerEventId?: string;
  method: PaymentMethod;
  status: PaymentStatus;
  amount: Money;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}
