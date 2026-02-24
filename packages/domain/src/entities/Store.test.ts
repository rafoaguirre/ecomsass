import { describe, expect, it } from 'vitest';

import type { Store } from './Store';
import { StoreType } from '../enums';

describe('Store entity interface', () => {
  it('should satisfy the Store interface shape', () => {
    const store: Store = {
      id: 'store-1',
      vendorProfileId: 'vendor-1',
      name: 'Test Store',
      slug: 'test-store',
      storeType: StoreType.General,
      address: {
        street: '123 Main St',
        city: 'Toronto',
        province: 'ON',
        country: 'CA',
        postalCode: 'M5V 1A1',
      },
      isActive: true,
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    expect(store.id).toBe('store-1');
    expect(store.slug).toBe('test-store');
    expect(store.isActive).toBe(true);
  });
});
