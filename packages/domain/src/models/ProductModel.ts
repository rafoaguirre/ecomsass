import type { Product, ProductVariant } from '../entities/Product';
import type { Money, Image } from '../value-objects';
import { ProductAvailability } from '../enums';
import { AggregateRoot } from '../core';
import { InvariantError } from '../errors';
import { validateRequired, validateSlug, validateNonNegative } from './validation';

/**
 * Input for creating a new ProductModel via the factory method.
 */
export interface CreateProductInput {
  id: string;
  storeId: string;
  name: string;
  slug: string;
  price: Money;
  description?: string;
  compareAtPrice?: Money;
  images?: Image[];
  categoryId?: string;
  supplierId?: string;
  availability?: ProductAvailability;
  inventory?: {
    quantity: number;
    trackQuantity: boolean;
    lowStockThreshold?: number;
  };
  variants?: ProductVariant[];
  tags?: string[];
  metadata?: Record<string, unknown>;
}

const DEFAULT_LOW_STOCK_THRESHOLD = 5;

/**
 * Rich domain model for Product aggregate root.
 *
 * Extends AggregateRoot for identity equality and domain-event support.
 * Implements the Product interface via getters delegating to the props bag.
 * All mutations return a new ProductModel instance (immutable).
 */
export class ProductModel extends AggregateRoot<Product> implements Product {
  // --- Property accessors (delegate to props) --------------------------------

  get storeId(): string {
    return this.props.storeId;
  }
  get name(): string {
    return this.props.name;
  }
  get slug(): string {
    return this.props.slug;
  }
  get description(): string | undefined {
    return this.props.description;
  }
  get price(): Money {
    return this.props.price;
  }
  get compareAtPrice(): Money | undefined {
    return this.props.compareAtPrice;
  }
  get images(): Image[] {
    return this.props.images;
  }
  get categoryId(): string | undefined {
    return this.props.categoryId;
  }
  get supplierId(): string | undefined {
    return this.props.supplierId;
  }
  get availability(): ProductAvailability {
    return this.props.availability;
  }
  get inventory(): Product['inventory'] {
    return this.props.inventory;
  }
  get variants(): ProductVariant[] | undefined {
    return this.props.variants;
  }
  get tags(): string[] {
    return this.props.tags;
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

  private constructor(props: Product) {
    super(props);
    this.validate();
  }

  // ---------------------------------------------------------------------------
  // Factory
  // ---------------------------------------------------------------------------

  /**
   * Create a new ProductModel with sensible defaults.
   */
  static create(input: CreateProductInput): ProductModel {
    const now = new Date();
    return new ProductModel({
      ...input,
      images: input.images ?? [],
      availability: input.availability ?? ProductAvailability.Available,
      tags: input.tags ?? [],
      metadata: input.metadata ?? {},
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * Reconstitute a ProductModel from persisted data.
   */
  static fromData(data: Product): ProductModel {
    return new ProductModel(data);
  }

  // ---------------------------------------------------------------------------
  // Validation (single source of truth — runs in constructor)
  // ---------------------------------------------------------------------------

  private validate(): void {
    validateRequired(this.name, 'Product name');
    validateSlug(this.slug, 'Product');
    validateNonNegative(this.price.amount, 'Product price');

    if (this.compareAtPrice !== undefined) {
      validateNonNegative(this.compareAtPrice.amount, 'Product price');
    }
  }

  // ---------------------------------------------------------------------------
  // Business queries
  // ---------------------------------------------------------------------------

  /**
   * Whether the product is currently in stock.
   * If inventory tracking is disabled, always returns true.
   */
  isInStock(): boolean {
    if (!this.inventory || !this.inventory.trackQuantity) {
      return true;
    }
    return this.inventory.quantity > 0;
  }

  /**
   * Whether inventory is at or below the low-stock threshold.
   * Returns false if inventory tracking is disabled.
   */
  isLowStock(): boolean {
    if (!this.inventory || !this.inventory.trackQuantity) {
      return false;
    }
    const threshold = this.inventory.lowStockThreshold ?? DEFAULT_LOW_STOCK_THRESHOLD;
    return this.inventory.quantity > 0 && this.inventory.quantity <= threshold;
  }

  /**
   * Whether the product has a compare-at price higher than the current price
   * (i.e. it's marked down / on sale).
   */
  isOnSale(): boolean {
    if (!this.compareAtPrice) {
      return false;
    }
    return this.compareAtPrice.amount > this.price.amount;
  }

  /** Whether the product has any variants defined. */
  hasVariants(): boolean {
    return this.variants !== undefined && this.variants.length > 0;
  }

  /** Total number of variant options. */
  variantCount(): number {
    return this.variants?.length ?? 0;
  }

  /**
   * Whether the product is available for purchase (in stock + active).
   */
  isAvailable(): boolean {
    return this.availability === ProductAvailability.Available && this.isInStock();
  }

  // ---------------------------------------------------------------------------
  // Immutable updates (withUpdates handles timestamp + re-validation)
  // ---------------------------------------------------------------------------

  private withUpdates(updates: Partial<Product>): ProductModel {
    return new ProductModel({ ...this.props, ...updates, updatedAt: new Date() });
  }

  /**
   * Returns a new ProductModel with adjusted inventory quantity.
   * Delta can be positive (restock) or negative (sale).
   * Throws if result would be negative.
   */
  adjustInventory(delta: number): ProductModel {
    if (!this.inventory) {
      throw new InvariantError('Cannot adjust inventory: product has no inventory tracking');
    }
    const newQuantity = this.inventory.quantity + delta;
    if (newQuantity < 0) {
      throw new InvariantError('Inventory quantity cannot be negative');
    }
    return this.withUpdates({
      inventory: { ...this.inventory, quantity: newQuantity },
    });
  }

  /** Returns a new ProductModel with the updated price. */
  updatePrice(newPrice: Money): ProductModel {
    return this.withUpdates({ price: newPrice });
  }

  /** Returns a new ProductModel with a variant added. */
  addVariant(variant: ProductVariant): ProductModel {
    const existing = this.variants ?? [];
    if (existing.some((v) => v.id === variant.id)) {
      throw new InvariantError(`Variant with id "${variant.id}" already exists`);
    }
    return this.withUpdates({ variants: [...existing, variant] });
  }

  /** Returns a new ProductModel with the specified variant removed. */
  removeVariant(variantId: string): ProductModel {
    const existing = this.variants ?? [];
    const filtered = existing.filter((v) => v.id !== variantId);
    if (filtered.length === existing.length) {
      throw new InvariantError(`Variant with id "${variantId}" not found`);
    }
    return this.withUpdates({ variants: filtered });
  }

  /** Returns a new ProductModel with the updated availability status. */
  updateAvailability(availability: ProductAvailability): ProductModel {
    return this.withUpdates({ availability });
  }

  /** Returns a new ProductModel with a tag added. */
  addTag(tag: string): ProductModel {
    if (this.tags.includes(tag)) {
      return this;
    }
    return this.withUpdates({ tags: [...this.tags, tag] });
  }

  /** Returns a new ProductModel with a tag removed. */
  removeTag(tag: string): ProductModel {
    const filtered = this.tags.filter((t) => t !== tag);
    if (filtered.length === this.tags.length) {
      return this;
    }
    return this.withUpdates({ tags: filtered });
  }
}
