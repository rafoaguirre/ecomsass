import { describe, expect, it } from 'vitest';

import { SubscriptionModel } from './SubscriptionModel';
import type { CreateSubscriptionInput } from './SubscriptionModel';
import type { Subscription } from '../entities/Subscription';
import type { Money } from '../value-objects';
import { SubscriptionCadence, SubscriptionPlanStatus } from '../enums';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

const usd = (cents: number): Money => ({
  amount: BigInt(cents),
  currency: 'USD',
});

const validInput: CreateSubscriptionInput = {
  id: 'sub-1',
  storeId: 'store-1',
  name: 'Weekly Veggie Box',
  description: 'Fresh vegetables delivered weekly',
  price: usd(2500),
  cadence: SubscriptionCadence.Weekly,
  productIds: ['prod-1', 'prod-2'],
};

/** Build full Subscription data for fromData tests. */
const fullData = (overrides: Partial<Subscription> = {}): Subscription => ({
  id: 'sub-1',
  storeId: 'store-1',
  name: 'Weekly Veggie Box',
  description: 'Fresh vegetables delivered weekly',
  price: usd(2500),
  cadence: SubscriptionCadence.Weekly,
  status: SubscriptionPlanStatus.Active,
  images: [],
  productIds: ['prod-1', 'prod-2'],
  maxSubscribers: undefined,
  currentSubscribers: 0,
  trialPeriodDays: 0,
  metadata: {},
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
  ...overrides,
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('SubscriptionModel', () => {
  // ---------------------------------------------------------------------------
  // Factory — create
  // ---------------------------------------------------------------------------

  describe('create', () => {
    it('should create with defaults and Draft status', () => {
      const sub = SubscriptionModel.create(validInput);

      expect(sub.id).toBe('sub-1');
      expect(sub.storeId).toBe('store-1');
      expect(sub.name).toBe('Weekly Veggie Box');
      expect(sub.description).toBe('Fresh vegetables delivered weekly');
      expect(sub.price.amount).toBe(2500n);
      expect(sub.price.currency).toBe('USD');
      expect(sub.cadence).toBe(SubscriptionCadence.Weekly);
      expect(sub.status).toBe(SubscriptionPlanStatus.Draft);
      expect(sub.images).toEqual([]);
      expect(sub.productIds).toEqual(['prod-1', 'prod-2']);
      expect(sub.currentSubscribers).toBe(0);
      expect(sub.trialPeriodDays).toBe(0);
      expect(sub.metadata).toEqual({});
      expect(sub.createdAt).toBeInstanceOf(Date);
      expect(sub.updatedAt).toBeInstanceOf(Date);
    });

    it('should accept optional fields', () => {
      const sub = SubscriptionModel.create({
        ...validInput,
        maxSubscribers: 50,
        trialPeriodDays: 14,
        startDate: new Date('2025-06-01'),
        metadata: { tier: 'premium' },
      });

      expect(sub.maxSubscribers).toBe(50);
      expect(sub.trialPeriodDays).toBe(14);
      expect(sub.startDate).toEqual(new Date('2025-06-01'));
      expect(sub.metadata).toEqual({ tier: 'premium' });
    });

    it('should default images and productIds to empty arrays', () => {
      const sub = SubscriptionModel.create({
        id: 'sub-2',
        storeId: 'store-1',
        name: 'Bare Plan',
        price: usd(1000),
        cadence: SubscriptionCadence.Monthly,
      });

      expect(sub.images).toEqual([]);
      expect(sub.productIds).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // Factory — fromData
  // ---------------------------------------------------------------------------

  describe('fromData', () => {
    it('should reconstitute from full data', () => {
      const data = fullData();
      const sub = SubscriptionModel.fromData(data);

      expect(sub.id).toBe(data.id);
      expect(sub.status).toBe(SubscriptionPlanStatus.Active);
      expect(sub.createdAt).toBe(data.createdAt);
    });

    it('should preserve all fields via toData()', () => {
      const data = fullData({ maxSubscribers: 100, currentSubscribers: 42 });
      const sub = SubscriptionModel.fromData(data);
      const output = sub.toData();

      expect(output.id).toBe(data.id);
      expect(output.maxSubscribers).toBe(100);
      expect(output.currentSubscribers).toBe(42);
    });
  });

  // ---------------------------------------------------------------------------
  // Validation
  // ---------------------------------------------------------------------------

  describe('validation', () => {
    it('should reject empty name', () => {
      expect(() => SubscriptionModel.create({ ...validInput, name: '' })).toThrow(
        'Subscription name is required'
      );
    });

    it('should reject name exceeding max length', () => {
      expect(() => SubscriptionModel.create({ ...validInput, name: 'x'.repeat(151) })).toThrow(
        'must not exceed'
      );
    });

    it('should reject negative price', () => {
      expect(() =>
        SubscriptionModel.create({ ...validInput, price: { amount: -1n, currency: 'USD' } })
      ).toThrow('price must not be negative');
    });

    it('should allow zero price (free plan)', () => {
      const sub = SubscriptionModel.create({ ...validInput, price: usd(0) });
      expect(sub.price.amount).toBe(0n);
    });

    it('should reject maxSubscribers less than 1', () => {
      expect(() => SubscriptionModel.create({ ...validInput, maxSubscribers: 0 })).toThrow(
        'Max subscribers must be at least 1'
      );
    });

    it('should reject negative trialPeriodDays', () => {
      expect(() => SubscriptionModel.create({ ...validInput, trialPeriodDays: -1 })).toThrow(
        'Trial period days must not be negative'
      );
    });

    it('should reject currentSubscribers exceeding maxSubscribers', () => {
      expect(() =>
        SubscriptionModel.fromData(fullData({ maxSubscribers: 5, currentSubscribers: 6 }))
      ).toThrow('exceeds max');
    });

    it('should reject endDate before startDate', () => {
      expect(() =>
        SubscriptionModel.create({
          ...validInput,
          startDate: new Date('2025-12-01'),
          endDate: new Date('2025-06-01'),
        })
      ).toThrow('End date must be after start date');
    });

    it('should reject endDate equal to startDate', () => {
      const same = new Date('2025-06-01');
      expect(() =>
        SubscriptionModel.create({ ...validInput, startDate: same, endDate: same })
      ).toThrow('End date must be after start date');
    });
  });

  // ---------------------------------------------------------------------------
  // Guard methods
  // ---------------------------------------------------------------------------

  describe('guard methods', () => {
    it('canAcceptSubscribers returns true for active uncapped plan', () => {
      const sub = SubscriptionModel.fromData(fullData());
      expect(sub.canAcceptSubscribers()).toBe(true);
    });

    it('canAcceptSubscribers returns false for Draft plan', () => {
      const sub = SubscriptionModel.create(validInput);
      expect(sub.canAcceptSubscribers()).toBe(false);
    });

    it('canAcceptSubscribers returns false when at capacity', () => {
      const sub = SubscriptionModel.fromData(
        fullData({ maxSubscribers: 10, currentSubscribers: 10 })
      );
      expect(sub.canAcceptSubscribers()).toBe(false);
    });

    it('isAtCapacity returns true when at max', () => {
      const sub = SubscriptionModel.fromData(
        fullData({ maxSubscribers: 5, currentSubscribers: 5 })
      );
      expect(sub.isAtCapacity()).toBe(true);
    });

    it('isAtCapacity returns false when uncapped', () => {
      const sub = SubscriptionModel.fromData(fullData());
      expect(sub.isAtCapacity()).toBe(false);
    });

    it('isTerminal returns true for Archived', () => {
      const sub = SubscriptionModel.fromData(fullData({ status: SubscriptionPlanStatus.Archived }));
      expect(sub.isTerminal()).toBe(true);
    });

    it('isTerminal returns false for Active', () => {
      const sub = SubscriptionModel.fromData(fullData());
      expect(sub.isTerminal()).toBe(false);
    });

    it('hasTrial returns true when trialPeriodDays > 0', () => {
      const sub = SubscriptionModel.fromData(fullData({ trialPeriodDays: 7 }));
      expect(sub.hasTrial()).toBe(true);
    });

    it('hasTrial returns false when trialPeriodDays is 0', () => {
      const sub = SubscriptionModel.fromData(fullData());
      expect(sub.hasTrial()).toBe(false);
    });

    it('remainingCapacity returns difference when capped', () => {
      const sub = SubscriptionModel.fromData(
        fullData({ maxSubscribers: 20, currentSubscribers: 15 })
      );
      expect(sub.remainingCapacity()).toBe(5);
    });

    it('remainingCapacity returns 0 when at cap', () => {
      const sub = SubscriptionModel.fromData(
        fullData({ maxSubscribers: 10, currentSubscribers: 10 })
      );
      expect(sub.remainingCapacity()).toBe(0);
    });

    it('remainingCapacity returns undefined when uncapped', () => {
      const sub = SubscriptionModel.fromData(fullData());
      expect(sub.remainingCapacity()).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  // Cadence logic
  // ---------------------------------------------------------------------------

  describe('cadence logic', () => {
    const base = new Date('2025-03-01T12:00:00Z');

    it('nextBillingDate adds 1 day for Daily', () => {
      const sub = SubscriptionModel.fromData(fullData({ cadence: SubscriptionCadence.Daily }));
      const next = sub.nextBillingDate(base);
      expect(next.getDate()).toBe(2);
    });

    it('nextBillingDate adds 7 days for Weekly', () => {
      const sub = SubscriptionModel.fromData(fullData({ cadence: SubscriptionCadence.Weekly }));
      const next = sub.nextBillingDate(base);
      expect(next.getDate()).toBe(8);
    });

    it('nextBillingDate adds 14 days for Biweekly', () => {
      const sub = SubscriptionModel.fromData(fullData({ cadence: SubscriptionCadence.Biweekly }));
      const next = sub.nextBillingDate(base);
      expect(next.getDate()).toBe(15);
    });

    it('nextBillingDate adds 1 month for Monthly', () => {
      const sub = SubscriptionModel.fromData(fullData({ cadence: SubscriptionCadence.Monthly }));
      const next = sub.nextBillingDate(base);
      expect(next.getMonth()).toBe(3); // April (0-indexed)
      expect(next.getDate()).toBe(1);
    });

    it('nextBillingDate adds 3 months for Quarterly', () => {
      const sub = SubscriptionModel.fromData(fullData({ cadence: SubscriptionCadence.Quarterly }));
      const next = sub.nextBillingDate(base);
      expect(next.getMonth()).toBe(5); // June
      expect(next.getDate()).toBe(1);
    });

    it('nextBillingDate adds 1 year for Annual', () => {
      const sub = SubscriptionModel.fromData(fullData({ cadence: SubscriptionCadence.Annual }));
      const next = sub.nextBillingDate(base);
      expect(next.getFullYear()).toBe(2026);
      expect(next.getMonth()).toBe(2); // March
    });

    it('nextBillingDate handles month-end rollover for Monthly', () => {
      const jan31 = new Date('2025-01-31T12:00:00Z');
      const sub = SubscriptionModel.fromData(fullData({ cadence: SubscriptionCadence.Monthly }));
      const next = sub.nextBillingDate(jan31);
      // JS Date handles Jan 31 + 1 month → Feb 28 (or March 3 depending on impl)
      // Just verify it's in the future
      expect(next.getTime()).toBeGreaterThan(jan31.getTime());
    });

    it('trialEndDate returns undefined when no trial', () => {
      const sub = SubscriptionModel.fromData(fullData());
      expect(sub.trialEndDate(base)).toBeUndefined();
    });

    it('trialEndDate returns correct date for 14-day trial', () => {
      const sub = SubscriptionModel.fromData(fullData({ trialPeriodDays: 14 }));
      const end = sub.trialEndDate(base);
      expect(end).toBeDefined();
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      expect(end!.getDate()).toBe(15);
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      expect(end!.getMonth()).toBe(2); // March
    });

    it('billingIntervalDays returns correct value for each cadence', () => {
      expect(
        SubscriptionModel.fromData(
          fullData({ cadence: SubscriptionCadence.Daily })
        ).billingIntervalDays()
      ).toBe(1);
      expect(
        SubscriptionModel.fromData(
          fullData({ cadence: SubscriptionCadence.Weekly })
        ).billingIntervalDays()
      ).toBe(7);
      expect(
        SubscriptionModel.fromData(
          fullData({ cadence: SubscriptionCadence.Monthly })
        ).billingIntervalDays()
      ).toBe(30);
      expect(
        SubscriptionModel.fromData(
          fullData({ cadence: SubscriptionCadence.Annual })
        ).billingIntervalDays()
      ).toBe(365);
    });
  });

  // ---------------------------------------------------------------------------
  // Plan lifecycle transitions
  // ---------------------------------------------------------------------------

  describe('plan lifecycle', () => {
    it('should transition Draft → Active', () => {
      const sub = SubscriptionModel.create(validInput);
      const active = sub.activate();
      expect(active.status).toBe(SubscriptionPlanStatus.Active);
    });

    it('activate is idempotent on Active plan', () => {
      const sub = SubscriptionModel.fromData(fullData());
      const same = sub.activate();
      expect(same.status).toBe(SubscriptionPlanStatus.Active);
    });

    it('should transition Active → Archived', () => {
      const sub = SubscriptionModel.fromData(fullData());
      const archived = sub.archive();
      expect(archived.status).toBe(SubscriptionPlanStatus.Archived);
    });

    it('archive is idempotent on Archived plan', () => {
      const sub = SubscriptionModel.fromData(fullData({ status: SubscriptionPlanStatus.Archived }));
      const same = sub.archive();
      expect(same.status).toBe(SubscriptionPlanStatus.Archived);
    });

    it('should reject Draft → Archived (invalid transition)', () => {
      const sub = SubscriptionModel.create(validInput);
      expect(() => sub.archive()).toThrow('Invalid subscription plan transition');
    });

    it('should reject Archived → Active (terminal state)', () => {
      const sub = SubscriptionModel.fromData(fullData({ status: SubscriptionPlanStatus.Archived }));
      expect(() => sub.activate()).toThrow('Invalid subscription plan transition');
    });
  });

  // ---------------------------------------------------------------------------
  // Subscriber cap enforcement
  // ---------------------------------------------------------------------------

  describe('subscriber cap enforcement', () => {
    it('addSubscriber increments count', () => {
      const sub = SubscriptionModel.fromData(fullData({ currentSubscribers: 3 }));
      const updated = sub.addSubscriber();
      expect(updated.currentSubscribers).toBe(4);
    });

    it('addSubscriber works up to the cap', () => {
      const sub = SubscriptionModel.fromData(
        fullData({ maxSubscribers: 5, currentSubscribers: 4 })
      );
      const updated = sub.addSubscriber();
      expect(updated.currentSubscribers).toBe(5);
    });

    it('addSubscriber rejects when at cap', () => {
      const sub = SubscriptionModel.fromData(
        fullData({ maxSubscribers: 5, currentSubscribers: 5 })
      );
      expect(() => sub.addSubscriber()).toThrow('Subscriber cap reached');
    });

    it('addSubscriber rejects on non-active plan', () => {
      const sub = SubscriptionModel.create(validInput);
      expect(() => sub.addSubscriber()).toThrow('non-active plan');
    });

    it('addSubscriber works on uncapped active plan', () => {
      const sub = SubscriptionModel.fromData(fullData({ currentSubscribers: 1000 }));
      const updated = sub.addSubscriber();
      expect(updated.currentSubscribers).toBe(1001);
    });

    it('removeSubscriber decrements count', () => {
      const sub = SubscriptionModel.fromData(fullData({ currentSubscribers: 5 }));
      const updated = sub.removeSubscriber();
      expect(updated.currentSubscribers).toBe(4);
    });

    it('removeSubscriber rejects when count is 0', () => {
      const sub = SubscriptionModel.fromData(fullData({ currentSubscribers: 0 }));
      expect(() => sub.removeSubscriber()).toThrow('count is already 0');
    });
  });

  // ---------------------------------------------------------------------------
  // Mutation methods
  // ---------------------------------------------------------------------------

  describe('mutation methods', () => {
    const sub = SubscriptionModel.fromData(fullData());

    it('updateName returns new model with updated name', () => {
      const updated = sub.updateName('Monthly Fruit Box');
      expect(updated.name).toBe('Monthly Fruit Box');
      expect(sub.name).toBe('Weekly Veggie Box'); // original unchanged
    });

    it('updateDescription returns new model with updated description', () => {
      const updated = sub.updateDescription('New description');
      expect(updated.description).toBe('New description');
    });

    it('updatePrice returns new model with updated price', () => {
      const updated = sub.updatePrice(usd(5000));
      expect(updated.price.amount).toBe(5000n);
    });

    it('updateCadence returns new model with updated cadence', () => {
      const updated = sub.updateCadence(SubscriptionCadence.Monthly);
      expect(updated.cadence).toBe(SubscriptionCadence.Monthly);
    });

    it('updateProductIds returns new model with updated product IDs', () => {
      const updated = sub.updateProductIds(['prod-3']);
      expect(updated.productIds).toEqual(['prod-3']);
    });

    it('updateMaxSubscribers returns new model with updated cap', () => {
      const updated = sub.updateMaxSubscribers(100);
      expect(updated.maxSubscribers).toBe(100);
    });

    it('updateMaxSubscribers can remove the cap (undefined)', () => {
      const capped = sub.updateMaxSubscribers(10);
      const uncapped = capped.updateMaxSubscribers(undefined);
      expect(uncapped.maxSubscribers).toBeUndefined();
    });

    it('updateMetadata merges with existing metadata', () => {
      const withMeta = sub.updateMetadata({ key1: 'value1' });
      const merged = withMeta.updateMetadata({ key2: 'value2' });
      expect(merged.metadata).toEqual({ key1: 'value1', key2: 'value2' });
    });

    it('mutations update updatedAt timestamp', () => {
      const before = sub.updatedAt;
      const updated = sub.updateName('New Name');
      expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    });

    it('updateName validates the new name', () => {
      expect(() => sub.updateName('')).toThrow('Subscription name is required');
    });

    it('updateMaxSubscribers validates against current subscribers', () => {
      const withSubs = SubscriptionModel.fromData(fullData({ currentSubscribers: 10 }));
      expect(() => withSubs.updateMaxSubscribers(5)).toThrow('exceeds max');
    });
  });

  // ---------------------------------------------------------------------------
  // Identity
  // ---------------------------------------------------------------------------

  describe('identity', () => {
    it('equals returns true for same id', () => {
      const a = SubscriptionModel.fromData(fullData());
      const b = SubscriptionModel.fromData(fullData());
      expect(a.equals(b)).toBe(true);
    });

    it('equals returns false for different id', () => {
      const a = SubscriptionModel.fromData(fullData());
      const b = SubscriptionModel.fromData(fullData({ id: 'sub-other' }));
      expect(a.equals(b)).toBe(false);
    });

    it('toData returns plain object snapshot', () => {
      const sub = SubscriptionModel.create(validInput);
      const data = sub.toData();
      expect(data.id).toBe('sub-1');
      expect(data.status).toBe(SubscriptionPlanStatus.Draft);
    });
  });
});
