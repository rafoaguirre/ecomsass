import { describe, expect, it } from 'vitest';
import {
  AddressSchema,
  CreateOrderRequestSchema,
  CreateProductRequestSchema,
  CreateStoreRequestSchema,
  CreateSubscriptionRequestSchema,
  LogSchema,
  MoneyInputSchema,
  MoneySchema,
  ProductSchema,
  StoreSchema,
} from './index';

import { validateSchema, safeValidateSchema } from '../helpers';

describe('value object schemas', () => {
  it('should validate Money and MoneyInput shapes', () => {
    expect(MoneySchema.parse({ amount: 1000n, currency: 'USD' }).currency).toBe('USD');
    expect(MoneyInputSchema.parse({ amount: 1000, currency: 'USD' }).amount).toBe(1000);
  });

  it('should validate Address shape', () => {
    const address = AddressSchema.parse({
      street: '123 Main St',
      city: 'Halifax',
      province: 'NS',
      country: 'CA',
      postalCode: 'B3H1A1',
    });

    expect(address.city).toBe('Halifax');
  });
});

describe('entity schemas', () => {
  it('should validate Store entity', () => {
    const result = StoreSchema.parse({
      id: 'store-1',
      vendorProfileId: 'vendor-1',
      name: 'Store',
      address: {
        street: '123 Main St',
        city: 'Halifax',
        province: 'NS',
        country: 'CA',
        postalCode: 'B3H1A1',
      },
      slug: 'store',
      storeType: 'GENERAL',
      isActive: true,
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    expect(result.id).toBe('store-1');
  });

  it('should validate Product entity', () => {
    const result = ProductSchema.parse({
      id: 'prod-1',
      storeId: 'store-1',
      name: 'Product',
      slug: 'product',
      price: { amount: 1000n, currency: 'USD' },
      images: [],
      availability: 'AVAILABLE',
      tags: [],
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    expect(result.id).toBe('prod-1');
  });

  it('should reject invalid log level', () => {
    const result = safeValidateSchema(LogSchema, {
      id: 'log-1',
      level: 'trace',
      action: 'x',
      entityType: 'order',
      entityId: 'order-1',
      message: 'hello',
      metadata: {},
      createdAt: new Date(),
    });

    expect(result.success).toBe(false);
  });
});

describe('DTO schemas', () => {
  it('should validate CreateStoreRequest', () => {
    const input = validateSchema(CreateStoreRequestSchema, {
      name: 'Store',
      address: {
        street: '123 Main St',
        city: 'Halifax',
        province: 'NS',
        country: 'CA',
        postalCode: 'B3H1A1',
      },
      slug: 'store',
      storeType: 'GENERAL',
    });

    expect(input.name).toBe('Store');
  });

  it('should validate CreateProductRequest', () => {
    const input = validateSchema(CreateProductRequestSchema, {
      storeId: '00000000-0000-4000-a000-000000000001',
      name: 'Product',
      price: { amount: 500, currency: 'USD' },
    });

    expect(input.price.amount).toBe(500);
  });

  it('should validate CreateOrderRequest', () => {
    const input = validateSchema(CreateOrderRequestSchema, {
      items: [{ productId: 'prod-1', quantity: 1 }],
      payment: { method: 'CREDIT' },
      fulfillment: { type: 'DELIVERY' },
    });

    expect(input.items[0]?.productId).toBe('prod-1');
  });

  it('should validate CreateSubscriptionRequest', () => {
    const input = validateSchema(CreateSubscriptionRequestSchema, {
      name: 'Sub',
      price: { amount: 999, currency: 'USD' },
      cadence: 'MONTHLY',
      productIds: ['prod-1'],
    });

    expect(input.cadence).toBe('MONTHLY');
  });

  it('should reject CreateOrderRequest when items is empty', () => {
    const result = safeValidateSchema(CreateOrderRequestSchema, {
      items: [],
      payment: { method: 'CREDIT' },
      fulfillment: { type: 'DELIVERY' },
    });

    expect(result.success).toBe(false);
  });
});
