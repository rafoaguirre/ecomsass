import { describe, expect, it } from 'vitest';

import type { Store } from './Store.js';
import { StoreType } from '../enums/index.js';

describe('Store entity', () => {
  it('should satisfy the Store interface shape', () => {
    const store: Store = {
      id: 'store-1',
      vendorProfileId: 'vendor-1',
      name: 'Test Store',
      slug: 'test-store',
      storeType: StoreType.Restaurant,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    expect(store.id).toBe('store-1');
    expect(store.slug).toBe('test-store');
    expect(store.isActive).toBe(true);
  });
});
