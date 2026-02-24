import type { SubscriptionCadence, SubscriptionStatus } from '../enums';
import type { Money, Image } from '../value-objects';

/**
 * Subscription entity
 * Represents a recurring product offering
 */
export interface Subscription {
  id: string;
  storeId: string;
  name: string;
  description?: string;
  price: Money;
  cadence: SubscriptionCadence;
  status: SubscriptionStatus;
  images: Image[];
  productIds: string[];
  maxSubscribers?: number;
  currentSubscribers: number;
  startDate?: Date;
  endDate?: Date;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Customer subscription instance
 */
export interface CustomerSubscription {
  id: string;
  userId: string;
  subscriptionId: string;
  status: SubscriptionStatus;
  startDate: Date;
  nextBillingDate?: Date;
  endDate?: Date;
  pausedAt?: Date;
  cancelledAt?: Date;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}
