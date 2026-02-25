import { describe, expect, it } from 'vitest';

import { ProductModel } from './ProductModel';
import type { CreateProductInput } from './ProductModel';
import { ProductAvailability } from '../enums';
import type { Money } from '../value-objects';
import type { ProductVariant } from '../entities/Product';

const usd = (cents: number): Money => ({ amount: BigInt(cents), currency: 'USD' });

const validInput: CreateProductInput = {
  id: 'prod-1',
  storeId: 'store-1',
  name: 'Widget',
  slug: 'widget',
  price: usd(1999),
};

const variantA: ProductVariant = {
  id: 'var-a',
  name: 'Small',
  attributes: { size: 'S' },
};

const variantB: ProductVariant = {
  id: 'var-b',
  name: 'Large',
  attributes: { size: 'L' },
};

describe('ProductModel', () => {
  // ---------------------------------------------------------------------------
  // Factory — create
  // ---------------------------------------------------------------------------

  describe('create', () => {
    it('should create with defaults', () => {
      const product = ProductModel.create(validInput);

      expect(product.id).toBe('prod-1');
      expect(product.storeId).toBe('store-1');
      expect(product.name).toBe('Widget');
      expect(product.slug).toBe('widget');
      expect(product.price).toEqual(usd(1999));
      expect(product.availability).toBe(ProductAvailability.Available);
      expect(product.images).toEqual([]);
      expect(product.tags).toEqual([]);
      expect(product.metadata).toEqual({});
      expect(product.createdAt).toBeInstanceOf(Date);
    });

    it('should accept optional fields', () => {
      const product = ProductModel.create({
        ...validInput,
        description: 'A fine widget',
        compareAtPrice: usd(2499),
        categoryId: 'cat-1',
        tags: ['sale', 'popular'],
        inventory: { quantity: 50, trackQuantity: true, lowStockThreshold: 10 },
      });

      expect(product.description).toBe('A fine widget');
      expect(product.compareAtPrice).toEqual(usd(2499));
      expect(product.categoryId).toBe('cat-1');
      expect(product.tags).toEqual(['sale', 'popular']);
      expect(product.inventory?.quantity).toBe(50);
    });
  });

  // ---------------------------------------------------------------------------
  // Factory — fromData
  // ---------------------------------------------------------------------------

  describe('fromData', () => {
    it('should reconstitute from raw data', () => {
      const data = ProductModel.create(validInput).toData();
      const product = ProductModel.fromData(data);
      expect(product.id).toBe(data.id);
      expect(product.price).toEqual(data.price);
    });
  });

  // ---------------------------------------------------------------------------
  // Validation — name
  // ---------------------------------------------------------------------------

  describe('name validation', () => {
    it('should reject empty name', () => {
      expect(() => ProductModel.create({ ...validInput, name: '' })).toThrow(
        'Product name is required'
      );
    });

    it('should reject whitespace-only name', () => {
      expect(() => ProductModel.create({ ...validInput, name: '   ' })).toThrow(
        'Product name is required'
      );
    });
  });

  // ---------------------------------------------------------------------------
  // Validation — slug
  // ---------------------------------------------------------------------------

  describe('slug validation', () => {
    it('should reject empty slug', () => {
      expect(() => ProductModel.create({ ...validInput, slug: '' })).toThrow(
        'Product slug is required'
      );
    });

    it('should reject non-kebab-case slug', () => {
      expect(() => ProductModel.create({ ...validInput, slug: 'My Widget' })).toThrow(
        'Product slug must be kebab-case'
      );
    });

    it('should accept valid kebab-case slug', () => {
      const product = ProductModel.create({
        ...validInput,
        slug: 'my-great-widget',
      });
      expect(product.slug).toBe('my-great-widget');
    });
  });

  // ---------------------------------------------------------------------------
  // Validation — price
  // ---------------------------------------------------------------------------

  describe('price validation', () => {
    it('should reject negative price', () => {
      expect(() => ProductModel.create({ ...validInput, price: usd(-100) })).toThrow(
        'Product price must not be negative'
      );
    });

    it('should accept zero price (free product)', () => {
      const product = ProductModel.create({
        ...validInput,
        price: usd(0),
      });
      expect(product.price.amount).toBe(0n);
    });

    it('should reject negative compareAtPrice', () => {
      expect(() =>
        ProductModel.create({
          ...validInput,
          compareAtPrice: usd(-1),
        })
      ).toThrow('Product price must not be negative');
    });
  });

  // ---------------------------------------------------------------------------
  // Business queries — inventory
  // ---------------------------------------------------------------------------

  describe('isInStock', () => {
    it('should return true when no inventory tracking', () => {
      const product = ProductModel.create(validInput);
      expect(product.isInStock()).toBe(true);
    });

    it('should return true when trackQuantity is false', () => {
      const product = ProductModel.create({
        ...validInput,
        inventory: { quantity: 0, trackQuantity: false },
      });
      expect(product.isInStock()).toBe(true);
    });

    it('should return true when quantity > 0', () => {
      const product = ProductModel.create({
        ...validInput,
        inventory: { quantity: 10, trackQuantity: true },
      });
      expect(product.isInStock()).toBe(true);
    });

    it('should return false when quantity = 0 and tracking', () => {
      const product = ProductModel.create({
        ...validInput,
        inventory: { quantity: 0, trackQuantity: true },
      });
      expect(product.isInStock()).toBe(false);
    });
  });

  describe('isLowStock', () => {
    it('should return false when no inventory tracking', () => {
      const product = ProductModel.create(validInput);
      expect(product.isLowStock()).toBe(false);
    });

    it('should use default threshold of 5', () => {
      const product = ProductModel.create({
        ...validInput,
        inventory: { quantity: 5, trackQuantity: true },
      });
      expect(product.isLowStock()).toBe(true);
    });

    it('should use custom threshold', () => {
      const product = ProductModel.create({
        ...validInput,
        inventory: { quantity: 8, trackQuantity: true, lowStockThreshold: 10 },
      });
      expect(product.isLowStock()).toBe(true);
    });

    it('should return false when above threshold', () => {
      const product = ProductModel.create({
        ...validInput,
        inventory: { quantity: 20, trackQuantity: true, lowStockThreshold: 10 },
      });
      expect(product.isLowStock()).toBe(false);
    });

    it('should return false when quantity is 0 (out of stock, not low)', () => {
      const product = ProductModel.create({
        ...validInput,
        inventory: { quantity: 0, trackQuantity: true },
      });
      expect(product.isLowStock()).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // Business queries — pricing
  // ---------------------------------------------------------------------------

  describe('isOnSale', () => {
    it('should return false when no compareAtPrice', () => {
      const product = ProductModel.create(validInput);
      expect(product.isOnSale()).toBe(false);
    });

    it('should return true when compareAtPrice > price', () => {
      const product = ProductModel.create({
        ...validInput,
        compareAtPrice: usd(2999),
      });
      expect(product.isOnSale()).toBe(true);
    });

    it('should return false when compareAtPrice <= price', () => {
      const product = ProductModel.create({
        ...validInput,
        compareAtPrice: usd(1999),
      });
      expect(product.isOnSale()).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // Business queries — variants
  // ---------------------------------------------------------------------------

  describe('hasVariants / variantCount', () => {
    it('should return false when no variants', () => {
      const product = ProductModel.create(validInput);
      expect(product.hasVariants()).toBe(false);
      expect(product.variantCount()).toBe(0);
    });

    it('should return true when variants exist', () => {
      const product = ProductModel.create({
        ...validInput,
        variants: [variantA],
      });
      expect(product.hasVariants()).toBe(true);
      expect(product.variantCount()).toBe(1);
    });
  });

  // ---------------------------------------------------------------------------
  // Business queries — availability
  // ---------------------------------------------------------------------------

  describe('isAvailable', () => {
    it('should return true when available and in stock', () => {
      const product = ProductModel.create(validInput);
      expect(product.isAvailable()).toBe(true);
    });

    it('should return false when discontinued', () => {
      const product = ProductModel.create({
        ...validInput,
        availability: ProductAvailability.Discontinued,
      });
      expect(product.isAvailable()).toBe(false);
    });

    it('should return false when out of stock', () => {
      const product = ProductModel.create({
        ...validInput,
        inventory: { quantity: 0, trackQuantity: true },
      });
      expect(product.isAvailable()).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // Immutable updates — inventory
  // ---------------------------------------------------------------------------

  describe('adjustInventory', () => {
    it('should increase quantity', () => {
      const product = ProductModel.create({
        ...validInput,
        inventory: { quantity: 10, trackQuantity: true },
      });
      const updated = product.adjustInventory(5);
      expect(updated.inventory?.quantity).toBe(15);
      expect(product.inventory?.quantity).toBe(10); // original unchanged
    });

    it('should decrease quantity', () => {
      const product = ProductModel.create({
        ...validInput,
        inventory: { quantity: 10, trackQuantity: true },
      });
      const updated = product.adjustInventory(-3);
      expect(updated.inventory?.quantity).toBe(7);
    });

    it('should throw when result would be negative', () => {
      const product = ProductModel.create({
        ...validInput,
        inventory: { quantity: 5, trackQuantity: true },
      });
      expect(() => product.adjustInventory(-10)).toThrow('Inventory quantity cannot be negative');
    });

    it('should throw when no inventory tracking', () => {
      const product = ProductModel.create(validInput);
      expect(() => product.adjustInventory(1)).toThrow('Cannot adjust inventory');
    });
  });

  // ---------------------------------------------------------------------------
  // Immutable updates — price
  // ---------------------------------------------------------------------------

  describe('updatePrice', () => {
    it('should return new instance with updated price', () => {
      const product = ProductModel.create(validInput);
      const updated = product.updatePrice(usd(2499));
      expect(updated.price).toEqual(usd(2499));
      expect(product.price).toEqual(usd(1999)); // original unchanged
    });

    it('should reject negative price', () => {
      const product = ProductModel.create(validInput);
      expect(() => product.updatePrice(usd(-1))).toThrow('Product price must not be negative');
    });
  });

  // ---------------------------------------------------------------------------
  // Immutable updates — variants
  // ---------------------------------------------------------------------------

  describe('addVariant / removeVariant', () => {
    it('should add a variant', () => {
      const product = ProductModel.create(validInput);
      const updated = product.addVariant(variantA);
      expect(updated.hasVariants()).toBe(true);
      expect(updated.variantCount()).toBe(1);
    });

    it('should throw when adding duplicate variant id', () => {
      const product = ProductModel.create({
        ...validInput,
        variants: [variantA],
      });
      expect(() => product.addVariant(variantA)).toThrow('already exists');
    });

    it('should remove a variant', () => {
      const product = ProductModel.create({
        ...validInput,
        variants: [variantA, variantB],
      });
      const updated = product.removeVariant('var-a');
      expect(updated.variantCount()).toBe(1);
      expect(updated.variants?.[0]?.id).toBe('var-b');
    });

    it('should throw when removing non-existent variant', () => {
      const product = ProductModel.create(validInput);
      expect(() => product.removeVariant('nope')).toThrow('not found');
    });
  });

  // ---------------------------------------------------------------------------
  // Immutable updates — tags
  // ---------------------------------------------------------------------------

  describe('addTag / removeTag', () => {
    it('should add a tag', () => {
      const product = ProductModel.create(validInput);
      const updated = product.addTag('featured');
      expect(updated.tags).toContain('featured');
    });

    it('should be idempotent for duplicate tags', () => {
      const product = ProductModel.create({
        ...validInput,
        tags: ['featured'],
      });
      const same = product.addTag('featured');
      expect(same).toBe(product);
    });

    it('should remove a tag', () => {
      const product = ProductModel.create({
        ...validInput,
        tags: ['featured', 'sale'],
      });
      const updated = product.removeTag('featured');
      expect(updated.tags).toEqual(['sale']);
    });

    it('should be idempotent when removing non-existent tag', () => {
      const product = ProductModel.create(validInput);
      const same = product.removeTag('nope');
      expect(same).toBe(product);
    });
  });

  // ---------------------------------------------------------------------------
  // Immutable updates — availability
  // ---------------------------------------------------------------------------

  describe('updateAvailability', () => {
    it('should update availability status', () => {
      const product = ProductModel.create(validInput);
      const updated = product.updateAvailability(ProductAvailability.Discontinued);
      expect(updated.availability).toBe(ProductAvailability.Discontinued);
    });
  });

  // ---------------------------------------------------------------------------
  // Serialization
  // ---------------------------------------------------------------------------

  describe('toData', () => {
    it('should return a plain object conforming to Product interface', () => {
      const product = ProductModel.create({
        ...validInput,
        inventory: { quantity: 10, trackQuantity: true },
        variants: [variantA],
        tags: ['sale'],
      });
      const data = product.toData();

      expect(data.id).toBe('prod-1');
      expect(data.price).toEqual(usd(1999));
      expect(data.inventory?.quantity).toBe(10);
      expect(data.variants?.length).toBe(1);
      expect(data.tags).toEqual(['sale']);
    });
  });
});
