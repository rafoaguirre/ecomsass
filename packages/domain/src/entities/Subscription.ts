import type { SubscriptionCadence, SubscriptionPlanStatus, SubscriptionStatus } from '../enums';
import type { Money, Image } from '../value-objects';

/**
 * Subscription plan entity (vendor-managed offering).
 *
 * Represents a recurring product bundle that customers can subscribe to.
 * The plan defines cadence, pricing, subscriber cap, and product contents.
 */
export interface Subscription {
  id: string;
  storeId: string;
  name: string;
  description?: string;
  price: Money;
  cadence: SubscriptionCadence;
  status: SubscriptionPlanStatus;
  images: Image[];
  productIds: string[];
  maxSubscribers?: number;
  currentSubscribers: number;
  trialPeriodDays: number;
  startDate?: Date;
  endDate?: Date;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Customer subscription instance.
 *
 * Represents an individual customer's active (or inactive) subscription
 * to a plan. Tracks billing cycle, pause/resume, and cancellation state.
 */
export interface CustomerSubscription {
  id: string;
  userId: string;
  subscriptionId: string;
  status: SubscriptionStatus;
  startDate: Date;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  nextBillingDate?: Date;
  endDate?: Date;
  pausedAt?: Date;
  cancelledAt?: Date;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}
