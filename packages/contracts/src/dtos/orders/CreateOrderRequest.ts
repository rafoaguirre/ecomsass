import type { PaymentMethod, FulfillmentType } from '@ecomsaas/domain/enums';
import type { Address } from '@ecomsaas/domain/value-objects';

/**
 * Create order request
 */
export interface CreateOrderRequest {
  items: Array<{
    productId: string;
    variantId?: string;
    quantity: number;
  }>;
  payment: {
    method: PaymentMethod;
  };
  fulfillment: {
    type: FulfillmentType;
    address?: Address;
    scheduledFor?: string;
    notes?: string;
  };
  notes?: string;
  metadata?: Record<string, unknown>;
}
