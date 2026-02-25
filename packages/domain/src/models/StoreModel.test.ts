import { describe, expect, it } from 'vitest';

import { StoreModel } from './StoreModel';
import type { CreateStoreInput } from './StoreModel';
import { StoreType } from '../enums';
import type { OperatingHours } from '../value-objects';

const validInput: CreateStoreInput = {
  id: 'store-1',
  vendorProfileId: 'vendor-1',
  name: 'Test Store',
  slug: 'test-store',
  storeType: StoreType.General,
};

describe('StoreModel', () => {
  // ---------------------------------------------------------------------------
  // Factory — create
  // ---------------------------------------------------------------------------

  describe('create', () => {
    it('should create a StoreModel with defaults', () => {
      const store = StoreModel.create(validInput);

      expect(store.id).toBe('store-1');
      expect(store.vendorProfileId).toBe('vendor-1');
      expect(store.name).toBe('Test Store');
      expect(store.slug).toBe('test-store');
      expect(store.storeType).toBe(StoreType.General);
      expect(store.isActive).toBe(false);
      expect(store.metadata).toEqual({});
      expect(store.address).toEqual({
        street: '',
        city: '',
        province: '',
        country: '',
        postalCode: '',
      });
      expect(store.createdAt).toBeInstanceOf(Date);
      expect(store.updatedAt).toBeInstanceOf(Date);
    });

    it('should accept optional fields', () => {
      const store = StoreModel.create({
        ...validInput,
        description: 'A great store',
        email: 'test@example.com',
        phoneNumber: '555-1234',
        metadata: { source: 'import' },
      });

      expect(store.description).toBe('A great store');
      expect(store.email).toBe('test@example.com');
      expect(store.phoneNumber).toBe('555-1234');
      expect(store.metadata).toEqual({ source: 'import' });
    });

    it('should accept a custom address', () => {
      const address = {
        street: '123 Main St',
        city: 'Toronto',
        province: 'ON',
        country: 'CA',
        postalCode: 'M5V 1A1',
      };
      const store = StoreModel.create({ ...validInput, address });

      expect(store.address).toEqual(address);
    });
  });

  // ---------------------------------------------------------------------------
  // Factory — fromData
  // ---------------------------------------------------------------------------

  describe('fromData', () => {
    it('should reconstitute from raw data', () => {
      const data = StoreModel.create(validInput).toData();
      const store = StoreModel.fromData(data);

      expect(store.id).toBe(data.id);
      expect(store.name).toBe(data.name);
    });
  });

  // ---------------------------------------------------------------------------
  // Validation — name
  // ---------------------------------------------------------------------------

  describe('name validation', () => {
    it('should reject empty name', () => {
      expect(() => StoreModel.create({ ...validInput, name: '' })).toThrow(
        'Store name is required'
      );
    });

    it('should reject whitespace-only name', () => {
      expect(() => StoreModel.create({ ...validInput, name: '   ' })).toThrow(
        'Store name is required'
      );
    });

    it('should reject name exceeding 100 characters', () => {
      const longName = 'a'.repeat(101);
      expect(() => StoreModel.create({ ...validInput, name: longName })).toThrow(
        'Store name must not exceed 100 characters'
      );
    });

    it('should accept name at exactly 100 characters', () => {
      const name = 'a'.repeat(100);
      const store = StoreModel.create({ ...validInput, name });
      expect(store.name).toBe(name);
    });
  });

  // ---------------------------------------------------------------------------
  // Validation — slug
  // ---------------------------------------------------------------------------

  describe('slug validation', () => {
    it('should reject slug shorter than 3 characters', () => {
      expect(() => StoreModel.create({ ...validInput, slug: 'ab' })).toThrow(
        'Store slug must be at least 3 characters'
      );
    });

    it('should reject slug exceeding 50 characters', () => {
      const longSlug = 'a'.repeat(51);
      expect(() => StoreModel.create({ ...validInput, slug: longSlug })).toThrow(
        'Store slug must not exceed 50 characters'
      );
    });

    it('should reject uppercase slug', () => {
      expect(() => StoreModel.create({ ...validInput, slug: 'Test-Store' })).toThrow(
        'Store slug must be kebab-case'
      );
    });

    it('should reject slug with spaces', () => {
      expect(() => StoreModel.create({ ...validInput, slug: 'test store' })).toThrow(
        'Store slug must be kebab-case'
      );
    });

    it('should reject slug with trailing hyphen', () => {
      expect(() => StoreModel.create({ ...validInput, slug: 'test-store-' })).toThrow(
        'Store slug must be kebab-case'
      );
    });

    it('should accept valid kebab-case slug', () => {
      const store = StoreModel.create({
        ...validInput,
        slug: 'my-great-store',
      });
      expect(store.slug).toBe('my-great-store');
    });
  });

  // ---------------------------------------------------------------------------
  // Validation — email
  // ---------------------------------------------------------------------------

  describe('email validation', () => {
    it('should reject invalid email', () => {
      expect(() => StoreModel.create({ ...validInput, email: 'not-an-email' })).toThrow(
        'Store email is not a valid email address'
      );
    });

    it('should accept valid email', () => {
      const store = StoreModel.create({
        ...validInput,
        email: 'shop@example.com',
      });
      expect(store.email).toBe('shop@example.com');
    });

    it('should allow undefined email', () => {
      const store = StoreModel.create(validInput);
      expect(store.email).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  // Business methods — isOpen
  // ---------------------------------------------------------------------------

  describe('isOpen', () => {
    const mondayHours: OperatingHours[] = [
      { dayOfWeek: 1, openTime: '09:00', closeTime: '17:00', isClosed: false },
    ];

    it('should return false when no operating hours defined', () => {
      const store = StoreModel.create(validInput).activate();
      expect(store.isOpen()).toBe(false);
    });

    it('should return false when store is inactive', () => {
      const store = StoreModel.create({
        ...validInput,
        operatingHours: mondayHours,
      });
      // store starts inactive
      const monday10am = new Date('2026-02-23T10:00:00'); // Monday
      expect(store.isOpen(monday10am)).toBe(false);
    });

    it('should return true when within operating hours', () => {
      const store = StoreModel.create({
        ...validInput,
        operatingHours: mondayHours,
      }).activate();
      const monday10am = new Date('2026-02-23T10:00:00'); // Monday
      expect(store.isOpen(monday10am)).toBe(true);
    });

    it('should return false when outside operating hours', () => {
      const store = StoreModel.create({
        ...validInput,
        operatingHours: mondayHours,
      }).activate();
      const monday8am = new Date('2026-02-23T08:00:00'); // Before open
      expect(store.isOpen(monday8am)).toBe(false);
    });

    it('should return false on a day with no hours', () => {
      const store = StoreModel.create({
        ...validInput,
        operatingHours: mondayHours,
      }).activate();
      const tuesday10am = new Date('2026-02-24T10:00:00'); // Tuesday
      expect(store.isOpen(tuesday10am)).toBe(false);
    });

    it('should return false when day is marked as closed', () => {
      const store = StoreModel.create({
        ...validInput,
        operatingHours: [
          {
            dayOfWeek: 1,
            openTime: '09:00',
            closeTime: '17:00',
            isClosed: true,
          },
        ],
      }).activate();
      const monday10am = new Date('2026-02-23T10:00:00');
      expect(store.isOpen(monday10am)).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // Business methods — activate / deactivate
  // ---------------------------------------------------------------------------

  describe('activate / deactivate', () => {
    it('should activate an inactive store', () => {
      const store = StoreModel.create(validInput);
      expect(store.isActive).toBe(false);

      const active = store.activate();
      expect(active.isActive).toBe(true);
      expect(active).not.toBe(store); // immutable
    });

    it('should return same instance when already active', () => {
      const store = StoreModel.create(validInput).activate();
      const same = store.activate();
      expect(same).toBe(store);
    });

    it('should deactivate an active store', () => {
      const store = StoreModel.create(validInput).activate();
      const inactive = store.deactivate();
      expect(inactive.isActive).toBe(false);
      expect(inactive).not.toBe(store);
    });

    it('should return same instance when already inactive', () => {
      const store = StoreModel.create(validInput);
      const same = store.deactivate();
      expect(same).toBe(store);
    });
  });

  // ---------------------------------------------------------------------------
  // Immutable updates
  // ---------------------------------------------------------------------------

  describe('immutable updates', () => {
    it('updateName should return a new instance with updated name', () => {
      const store = StoreModel.create(validInput);
      const updated = store.updateName('New Name');

      expect(updated.name).toBe('New Name');
      expect(store.name).toBe('Test Store'); // original unchanged
      expect(updated).not.toBe(store);
    });

    it('updateName should validate the new name', () => {
      const store = StoreModel.create(validInput);
      expect(() => store.updateName('')).toThrow('Store name is required');
    });

    it('updateSlug should return a new instance with updated slug', () => {
      const store = StoreModel.create(validInput);
      const updated = store.updateSlug('new-slug');

      expect(updated.slug).toBe('new-slug');
      expect(store.slug).toBe('test-store');
    });

    it('updateSlug should validate the new slug', () => {
      const store = StoreModel.create(validInput);
      expect(() => store.updateSlug('NO')).toThrow('Store slug must be at least 3 characters');
    });

    it('updateAddress should return a new instance', () => {
      const store = StoreModel.create(validInput);
      const address = {
        street: '456 Oak Ave',
        city: 'Vancouver',
        province: 'BC',
        country: 'CA',
        postalCode: 'V6B 1A1',
      };
      const updated = store.updateAddress(address);
      expect(updated.address).toEqual(address);
    });

    it('updateOperatingHours should replace hours', () => {
      const store = StoreModel.create(validInput);
      const hours: OperatingHours[] = [
        {
          dayOfWeek: 1,
          openTime: '08:00',
          closeTime: '20:00',
          isClosed: false,
        },
      ];
      const updated = store.updateOperatingHours(hours);
      expect(updated.operatingHours).toEqual(hours);
    });

    it('updateMetadata should merge with existing', () => {
      const store = StoreModel.create({
        ...validInput,
        metadata: { a: 1, b: 2 },
      });
      const updated = store.updateMetadata({ b: 99, c: 3 });
      expect(updated.metadata).toEqual({ a: 1, b: 99, c: 3 });
    });
  });

  // ---------------------------------------------------------------------------
  // Serialization
  // ---------------------------------------------------------------------------

  describe('toData', () => {
    it('should return a plain object conforming to Store interface', () => {
      const store = StoreModel.create(validInput);
      const data = store.toData();

      expect(data.id).toBe('store-1');
      expect(data.name).toBe('Test Store');
      expect(data.isActive).toBe(false);
      expect(typeof data.createdAt.getTime).toBe('function'); // is a Date
    });
  });
});
