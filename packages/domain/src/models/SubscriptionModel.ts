import type { Subscription } from '../entities/Subscription';
import type { Money, Image } from '../value-objects';
import { SubscriptionCadence, SubscriptionPlanStatus } from '../enums';
import { AggregateRoot } from '../core';
import { ValidationError, InvariantError } from '../errors';
import { validateRequired, validateMaxLength } from './validation';

// ---------------------------------------------------------------------------
// State machine — valid plan status transitions
// ---------------------------------------------------------------------------

/**
 * Subscription plan lifecycle state machine.
 *
 * ```
 * Draft → Active
 * Active → Archived
 * Archived → (terminal)
 * ```
 */
const VALID_TRANSITIONS = new Map<SubscriptionPlanStatus, ReadonlySet<SubscriptionPlanStatus>>([
  [SubscriptionPlanStatus.Draft, new Set([SubscriptionPlanStatus.Active])],
  [SubscriptionPlanStatus.Active, new Set([SubscriptionPlanStatus.Archived])],
]);

// ---------------------------------------------------------------------------
// Cadence helpers
// ---------------------------------------------------------------------------

/** Number of days per cadence interval (approximate for billing estimation). */
const CADENCE_DAYS: Record<SubscriptionCadence, number> = {
  [SubscriptionCadence.Daily]: 1,
  [SubscriptionCadence.Weekly]: 7,
  [SubscriptionCadence.Biweekly]: 14,
  [SubscriptionCadence.Monthly]: 30,
  [SubscriptionCadence.Quarterly]: 90,
  [SubscriptionCadence.Annual]: 365,
};

// ---------------------------------------------------------------------------
// Factory input
// ---------------------------------------------------------------------------

/**
 * Input for creating a new SubscriptionModel via the factory method.
 * Only requires fields that must be provided at creation time.
 */
export interface CreateSubscriptionInput {
  id: string;
  storeId: string;
  name: string;
  description?: string;
  price: Money;
  cadence: SubscriptionCadence;
  images?: Image[];
  productIds?: string[];
  maxSubscribers?: number;
  trialPeriodDays?: number;
  startDate?: Date;
  endDate?: Date;
  metadata?: Record<string, unknown>;
}

const MAX_NAME_LENGTH = 150;

// ---------------------------------------------------------------------------
// SubscriptionModel
// ---------------------------------------------------------------------------

/**
 * Rich domain model for Subscription aggregate root.
 *
 * Represents a vendor-managed subscription plan offering with cadence-based
 * billing, subscriber cap enforcement, and plan lifecycle management.
 * All mutations return a new SubscriptionModel instance (immutable).
 */
export class SubscriptionModel extends AggregateRoot<Subscription> implements Subscription {
  // --- Property accessors (delegate to props) --------------------------------

  get storeId(): string {
    return this.props.storeId;
  }
  get name(): string {
    return this.props.name;
  }
  get description(): string | undefined {
    return this.props.description;
  }
  get price(): Money {
    return this.props.price;
  }
  get cadence(): SubscriptionCadence {
    return this.props.cadence;
  }
  get status(): SubscriptionPlanStatus {
    return this.props.status;
  }
  get images(): Image[] {
    return this.props.images;
  }
  get productIds(): string[] {
    return this.props.productIds;
  }
  get maxSubscribers(): number | undefined {
    return this.props.maxSubscribers;
  }
  get currentSubscribers(): number {
    return this.props.currentSubscribers;
  }
  get trialPeriodDays(): number {
    return this.props.trialPeriodDays;
  }
  get startDate(): Date | undefined {
    return this.props.startDate;
  }
  get endDate(): Date | undefined {
    return this.props.endDate;
  }
  get metadata(): Record<string, unknown> {
    return this.props.metadata;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // --- Constructor (private) -------------------------------------------------

  private constructor(props: Subscription) {
    super(props);
    this.validate();
  }

  // ---------------------------------------------------------------------------
  // Factory
  // ---------------------------------------------------------------------------

  /**
   * Create a new SubscriptionModel in Draft status with sensible defaults.
   */
  static create(input: CreateSubscriptionInput): SubscriptionModel {
    const now = new Date();
    return new SubscriptionModel({
      ...input,
      status: SubscriptionPlanStatus.Draft,
      images: input.images ?? [],
      productIds: input.productIds ?? [],
      currentSubscribers: 0,
      trialPeriodDays: input.trialPeriodDays ?? 0,
      metadata: input.metadata ?? {},
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * Reconstitute a SubscriptionModel from persisted data (no default injection).
   */
  static fromData(data: Subscription): SubscriptionModel {
    return new SubscriptionModel(data);
  }

  // ---------------------------------------------------------------------------
  // Validation (single source of truth — runs in constructor)
  // ---------------------------------------------------------------------------

  private validate(): void {
    validateRequired(this.name, 'Subscription name');
    validateMaxLength(this.name, MAX_NAME_LENGTH, 'Subscription name');

    if (this.price.amount < 0n) {
      throw new ValidationError('Subscription price must not be negative', {
        field: 'price',
        constraint: 'nonNegative',
      });
    }

    if (this.currentSubscribers < 0) {
      throw new ValidationError('Current subscribers must not be negative', {
        field: 'currentSubscribers',
        constraint: 'nonNegative',
      });
    }

    if (this.maxSubscribers !== undefined && this.maxSubscribers < 1) {
      throw new ValidationError('Max subscribers must be at least 1', {
        field: 'maxSubscribers',
        constraint: 'min',
        min: 1,
      });
    }

    if (this.maxSubscribers !== undefined && this.currentSubscribers > this.maxSubscribers) {
      throw new InvariantError(
        `Current subscribers (${String(this.currentSubscribers)}) exceeds max (${String(this.maxSubscribers)})`,
        { field: 'currentSubscribers' }
      );
    }

    if (this.trialPeriodDays < 0) {
      throw new ValidationError('Trial period days must not be negative', {
        field: 'trialPeriodDays',
        constraint: 'nonNegative',
      });
    }

    if (this.startDate && this.endDate && this.endDate <= this.startDate) {
      throw new ValidationError('End date must be after start date', {
        field: 'endDate',
        constraint: 'afterStartDate',
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Guard methods (status queries)
  // ---------------------------------------------------------------------------

  /** Whether the plan can accept new subscribers. */
  canAcceptSubscribers(): boolean {
    if (this.status !== SubscriptionPlanStatus.Active) {
      return false;
    }
    if (this.maxSubscribers !== undefined && this.currentSubscribers >= this.maxSubscribers) {
      return false;
    }
    return true;
  }

  /** Whether the plan has reached its subscriber cap. */
  isAtCapacity(): boolean {
    return this.maxSubscribers !== undefined && this.currentSubscribers >= this.maxSubscribers;
  }

  /** Whether the plan is in a terminal state (Archived). */
  isTerminal(): boolean {
    return this.status === SubscriptionPlanStatus.Archived;
  }

  /** Whether the plan offers a free trial. */
  hasTrial(): boolean {
    return this.trialPeriodDays > 0;
  }

  /** Number of remaining subscriber slots, or undefined if uncapped. */
  remainingCapacity(): number | undefined {
    if (this.maxSubscribers === undefined) {
      return undefined;
    }
    return Math.max(0, this.maxSubscribers - this.currentSubscribers);
  }

  // ---------------------------------------------------------------------------
  // Cadence logic
  // ---------------------------------------------------------------------------

  /**
   * Calculate the next billing date from a given start date based on cadence.
   *
   * Uses calendar-aware arithmetic for month/quarter/year cadences.
   * For shorter cadences (daily, weekly, biweekly) uses day addition.
   */
  nextBillingDate(from: Date): Date {
    const next = new Date(from);

    switch (this.cadence) {
      case SubscriptionCadence.Daily:
        next.setDate(next.getDate() + CADENCE_DAYS[SubscriptionCadence.Daily]);
        break;
      case SubscriptionCadence.Weekly:
        next.setDate(next.getDate() + CADENCE_DAYS[SubscriptionCadence.Weekly]);
        break;
      case SubscriptionCadence.Biweekly:
        next.setDate(next.getDate() + CADENCE_DAYS[SubscriptionCadence.Biweekly]);
        break;
      case SubscriptionCadence.Monthly:
        next.setMonth(next.getMonth() + 1);
        break;
      case SubscriptionCadence.Quarterly:
        next.setMonth(next.getMonth() + 3);
        break;
      case SubscriptionCadence.Annual:
        next.setFullYear(next.getFullYear() + 1);
        break;
    }

    return next;
  }

  /**
   * Calculate the trial end date from a subscription start date.
   * Returns undefined if no trial is configured.
   */
  trialEndDate(subscriptionStart: Date): Date | undefined {
    if (this.trialPeriodDays <= 0) {
      return undefined;
    }
    const end = new Date(subscriptionStart);
    end.setDate(end.getDate() + this.trialPeriodDays);
    return end;
  }

  /**
   * How many days are in one billing cycle for this plan's cadence.
   */
  billingIntervalDays(): number {
    return CADENCE_DAYS[this.cadence];
  }

  // ---------------------------------------------------------------------------
  // Lifecycle transitions (plan status)
  // ---------------------------------------------------------------------------

  /** Transition plan from Draft to Active. */
  activate(): SubscriptionModel {
    if (this.status === SubscriptionPlanStatus.Active) {
      return this;
    }
    return this.transitionTo(SubscriptionPlanStatus.Active);
  }

  /** Transition plan from Active to Archived. */
  archive(): SubscriptionModel {
    if (this.status === SubscriptionPlanStatus.Archived) {
      return this;
    }
    return this.transitionTo(SubscriptionPlanStatus.Archived);
  }

  // ---------------------------------------------------------------------------
  // Subscriber cap enforcement
  // ---------------------------------------------------------------------------

  /**
   * Record a new subscriber joining the plan.
   * Enforces maxSubscribers cap.
   */
  addSubscriber(): SubscriptionModel {
    if (!this.canAcceptSubscribers()) {
      if (this.status !== SubscriptionPlanStatus.Active) {
        throw new InvariantError('Cannot add subscriber to a non-active plan', {
          field: 'status',
          currentStatus: this.status,
        });
      }
      throw new InvariantError(`Subscriber cap reached (${String(this.maxSubscribers)})`, {
        field: 'currentSubscribers',
        max: this.maxSubscribers,
      });
    }
    return this.withUpdates({ currentSubscribers: this.currentSubscribers + 1 });
  }

  /**
   * Record a subscriber leaving the plan.
   * Cannot go below zero.
   */
  removeSubscriber(): SubscriptionModel {
    if (this.currentSubscribers <= 0) {
      throw new InvariantError('Cannot remove subscriber: count is already 0', {
        field: 'currentSubscribers',
      });
    }
    return this.withUpdates({ currentSubscribers: this.currentSubscribers - 1 });
  }

  // ---------------------------------------------------------------------------
  // Mutation methods (immutable)
  // ---------------------------------------------------------------------------

  /** Returns a new SubscriptionModel with the updated name. */
  updateName(name: string): SubscriptionModel {
    return this.withUpdates({ name });
  }

  /** Returns a new SubscriptionModel with the updated description. */
  updateDescription(description: string): SubscriptionModel {
    return this.withUpdates({ description });
  }

  /** Returns a new SubscriptionModel with the updated price. */
  updatePrice(price: Money): SubscriptionModel {
    return this.withUpdates({ price });
  }

  /** Returns a new SubscriptionModel with the updated cadence. */
  updateCadence(cadence: SubscriptionCadence): SubscriptionModel {
    return this.withUpdates({ cadence });
  }

  /** Returns a new SubscriptionModel with the updated product IDs. */
  updateProductIds(productIds: string[]): SubscriptionModel {
    return this.withUpdates({ productIds });
  }

  /** Returns a new SubscriptionModel with the updated subscriber cap. */
  updateMaxSubscribers(maxSubscribers: number | undefined): SubscriptionModel {
    return this.withUpdates({ maxSubscribers });
  }

  /** Returns a new SubscriptionModel with merged metadata. */
  updateMetadata(metadata: Record<string, unknown>): SubscriptionModel {
    return this.withUpdates({ metadata: { ...this.metadata, ...metadata } });
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private withUpdates(updates: Partial<Subscription>): SubscriptionModel {
    return new SubscriptionModel({ ...this.props, ...updates, updatedAt: new Date() });
  }

  private transitionTo(target: SubscriptionPlanStatus): SubscriptionModel {
    this.assertTransition(target);
    return this.withUpdates({ status: target });
  }

  private assertTransition(target: SubscriptionPlanStatus): void {
    const allowed = VALID_TRANSITIONS.get(this.status);
    if (!allowed || !allowed.has(target)) {
      throw new InvariantError(`Invalid subscription plan transition: ${this.status} → ${target}`);
    }
  }
}
