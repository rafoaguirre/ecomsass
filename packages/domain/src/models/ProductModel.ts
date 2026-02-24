import type { Product, ProductVariant } from '../entities/Product';
import type { Money, Image } from '../value-objects';
import { ProductAvailability } from '../enums';

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

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DEFAULT_LOW_STOCK_THRESHOLD = 5;

/**
 * Rich domain model for Product entity.
 *
 * Implements the Product interface with business validation,
 * computed inventory/pricing queries, and immutable update methods.
 * All mutations return a new ProductModel instance.
 */
export class ProductModel implements Product {
  readonly id: string;
  readonly storeId: string;
  readonly name: string;
  readonly slug: string;
  readonly description?: string;
  readonly price: Money;
  readonly compareAtPrice?: Money;
  readonly images: Image[];
  readonly categoryId?: string;
  readonly supplierId?: string;
  readonly availability: ProductAvailability;
  readonly inventory?: {
    quantity: number;
    trackQuantity: boolean;
    lowStockThreshold?: number;
  };
  readonly variants?: ProductVariant[];
  readonly tags: string[];
  readonly metadata: Record<string, unknown>;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  private constructor(props: Product) {
    this.id = props.id;
    this.storeId = props.storeId;
    this.name = props.name;
    this.slug = props.slug;
    this.description = props.description;
    this.price = props.price;
    this.compareAtPrice = props.compareAtPrice;
    this.images = props.images;
    this.categoryId = props.categoryId;
    this.supplierId = props.supplierId;
    this.availability = props.availability;
    this.inventory = props.inventory;
    this.variants = props.variants;
    this.tags = props.tags;
    this.metadata = props.metadata;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;

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
  // Validation
  // ---------------------------------------------------------------------------

  private validate(): void {
    ProductModel.validateName(this.name);
    ProductModel.validateSlug(this.slug);
    ProductModel.validatePrice(this.price);

    if (this.compareAtPrice !== undefined) {
      ProductModel.validatePrice(this.compareAtPrice);
    }
  }

  static validateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error('Product name is required');
    }
  }

  static validateSlug(slug: string): void {
    if (!slug || slug.trim().length === 0) {
      throw new Error('Product slug is required');
    }
    if (!SLUG_PATTERN.test(slug)) {
      throw new Error('Product slug must be kebab-case (lowercase, hyphens only)');
    }
  }

  static validatePrice(price: Money): void {
    if (price.amountInCents < 0) {
      throw new Error('Product price must not be negative');
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
    return this.compareAtPrice.amountInCents > this.price.amountInCents;
  }

  /**
   * Whether the product has any variants defined.
   */
  hasVariants(): boolean {
    return this.variants !== undefined && this.variants.length > 0;
  }

  /**
   * Total number of variant options.
   */
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
  // Immutable updates
  // ---------------------------------------------------------------------------

  /**
   * Returns a new ProductModel with adjusted inventory quantity.
   * Delta can be positive (restock) or negative (sale).
   * Throws if result would be negative.
   */
  adjustInventory(delta: number): ProductModel {
    if (!this.inventory) {
      throw new Error('Cannot adjust inventory: product has no inventory tracking');
    }
    const newQuantity = this.inventory.quantity + delta;
    if (newQuantity < 0) {
      throw new Error('Inventory quantity cannot be negative');
    }
    return new ProductModel({
      ...this.toData(),
      inventory: { ...this.inventory, quantity: newQuantity },
      updatedAt: new Date(),
    });
  }

  /**
   * Returns a new ProductModel with the updated price.
   */
  updatePrice(newPrice: Money): ProductModel {
    ProductModel.validatePrice(newPrice);
    return new ProductModel({
      ...this.toData(),
      price: newPrice,
      updatedAt: new Date(),
    });
  }

  /**
   * Returns a new ProductModel with a variant added.
   */
  addVariant(variant: ProductVariant): ProductModel {
    const existing = this.variants ?? [];
    if (existing.some((v) => v.id === variant.id)) {
      throw new Error(`Variant with id "${variant.id}" already exists`);
    }
    return new ProductModel({
      ...this.toData(),
      variants: [...existing, variant],
      updatedAt: new Date(),
    });
  }

  /**
   * Returns a new ProductModel with the specified variant removed.
   */
  removeVariant(variantId: string): ProductModel {
    const existing = this.variants ?? [];
    const filtered = existing.filter((v) => v.id !== variantId);
    if (filtered.length === existing.length) {
      throw new Error(`Variant with id "${variantId}" not found`);
    }
    return new ProductModel({
      ...this.toData(),
      variants: filtered,
      updatedAt: new Date(),
    });
  }

  /**
   * Returns a new ProductModel with the updated availability status.
   */
  updateAvailability(availability: ProductAvailability): ProductModel {
    return new ProductModel({
      ...this.toData(),
      availability,
      updatedAt: new Date(),
    });
  }

  /**
   * Returns a new ProductModel with a tag added.
   */
  addTag(tag: string): ProductModel {
    if (this.tags.includes(tag)) {
      return this;
    }
    return new ProductModel({
      ...this.toData(),
      tags: [...this.tags, tag],
      updatedAt: new Date(),
    });
  }

  /**
   * Returns a new ProductModel with a tag removed.
   */
  removeTag(tag: string): ProductModel {
    const filtered = this.tags.filter((t) => t !== tag);
    if (filtered.length === this.tags.length) {
      return this;
    }
    return new ProductModel({
      ...this.toData(),
      tags: filtered,
      updatedAt: new Date(),
    });
  }

  // ---------------------------------------------------------------------------
  // Serialization
  // ---------------------------------------------------------------------------

  /**
   * Returns a plain object conforming to the Product interface.
   */
  toData(): Product {
    return {
      id: this.id,
      storeId: this.storeId,
      name: this.name,
      slug: this.slug,
      description: this.description,
      price: this.price,
      compareAtPrice: this.compareAtPrice,
      images: this.images,
      categoryId: this.categoryId,
      supplierId: this.supplierId,
      availability: this.availability,
      inventory: this.inventory,
      variants: this.variants,
      tags: this.tags,
      metadata: this.metadata,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
