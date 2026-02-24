import type { SubscriptionCadence } from '@ecomsaas/domain/enums';
import type { ImageUpload } from '@ecomsaas/domain/value-objects';

/**
 * Create subscription request
 */
export interface CreateSubscriptionRequest {
  name: string;
  description?: string;
  price: {
    amount: number;
    currency: string;
  };
  cadence: SubscriptionCadence;
  productIds: string[];
  images?: ImageUpload[];
  maxSubscribers?: number;
  startDate?: string;
  endDate?: string;
  metadata?: Record<string, unknown>;
}
