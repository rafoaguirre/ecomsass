import type { Subscription } from '@ecomsaas/domain/entities';

/**
 * Subscription response
 */
export interface SubscriptionResponse extends Subscription {
  availableSlots?: number;
  productNames: string[];
}
