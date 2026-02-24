import type { Store } from '../entities/Store';
import type { Address, OperatingHours } from '../value-objects';
import type { StoreType } from '../enums';

/**
 * Input for creating a new StoreModel via the factory method.
 * Only requires fields that must be provided at creation time.
 */
export interface CreateStoreInput {
  id: string;
  vendorProfileId: string;
  name: string;
  slug: string;
  storeType: StoreType;
  description?: string;
  email?: string;
  phoneNumber?: string;
  phoneCountryCode?: string;
  address?: Address;
  operatingHours?: OperatingHours[];
  metadata?: Record<string, unknown>;
}

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_NAME_LENGTH = 100;
const MIN_SLUG_LENGTH = 3;
const MAX_SLUG_LENGTH = 50;

/**
 * Rich domain model for Store entity.
 *
 * Implements the Store interface with business validation,
 * computed properties, and immutable update methods.
 * All mutations return a new StoreModel instance.
 */
export class StoreModel implements Store {
  readonly id: string;
  readonly vendorProfileId: string;
  readonly name: string;
  readonly description?: string;
  readonly email?: string;
  readonly phoneNumber?: string;
  readonly phoneCountryCode?: string;
  readonly address: Address;
  readonly slug: string;
  readonly storeType: StoreType;
  readonly isActive: boolean;
  readonly operatingHours?: OperatingHours[];
  readonly metadata: Record<string, unknown>;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  private constructor(props: Store) {
    this.id = props.id;
    this.vendorProfileId = props.vendorProfileId;
    this.name = props.name;
    this.description = props.description;
    this.email = props.email;
    this.phoneNumber = props.phoneNumber;
    this.phoneCountryCode = props.phoneCountryCode;
    this.address = props.address;
    this.slug = props.slug;
    this.storeType = props.storeType;
    this.isActive = props.isActive;
    this.operatingHours = props.operatingHours;
    this.metadata = props.metadata;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;

    this.validate();
  }

  // ---------------------------------------------------------------------------
  // Factory
  // ---------------------------------------------------------------------------

  /**
   * Create a new StoreModel with sensible defaults.
   * Validates all invariants on creation.
   */
  static create(input: CreateStoreInput): StoreModel {
    const now = new Date();
    return new StoreModel({
      ...input,
      address: input.address ?? {
        street: '',
        city: '',
        province: '',
        country: '',
        postalCode: '',
      },
      isActive: false,
      metadata: input.metadata ?? {},
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * Reconstitute a StoreModel from persisted data (no default injection).
   */
  static fromData(data: Store): StoreModel {
    return new StoreModel(data);
  }

  // ---------------------------------------------------------------------------
  // Validation
  // ---------------------------------------------------------------------------

  private validate(): void {
    StoreModel.validateName(this.name);
    StoreModel.validateSlug(this.slug);

    if (this.email !== undefined && this.email !== '') {
      StoreModel.validateEmail(this.email);
    }
  }

  static validateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error('Store name is required');
    }
    if (name.length > MAX_NAME_LENGTH) {
      throw new Error(`Store name must not exceed ${String(MAX_NAME_LENGTH)} characters`);
    }
  }

  static validateSlug(slug: string): void {
    if (!slug || slug.length < MIN_SLUG_LENGTH) {
      throw new Error(`Store slug must be at least ${String(MIN_SLUG_LENGTH)} characters`);
    }
    if (slug.length > MAX_SLUG_LENGTH) {
      throw new Error(`Store slug must not exceed ${String(MAX_SLUG_LENGTH)} characters`);
    }
    if (!SLUG_PATTERN.test(slug)) {
      throw new Error('Store slug must be kebab-case (lowercase, hyphens only)');
    }
  }

  static validateEmail(email: string): void {
    if (!EMAIL_PATTERN.test(email)) {
      throw new Error('Store email is not a valid email address');
    }
  }

  // ---------------------------------------------------------------------------
  // Business methods
  // ---------------------------------------------------------------------------

  /**
   * Checks whether the store is currently open based on operating hours.
   * Returns false if no operating hours are defined.
   */
  isOpen(now: Date = new Date()): boolean {
    if (!this.operatingHours || this.operatingHours.length === 0) {
      return false;
    }
    if (!this.isActive) {
      return false;
    }

    const dayOfWeek = now.getDay(); // 0 = Sunday
    const todayHours = this.operatingHours.filter((oh) => oh.dayOfWeek === dayOfWeek);

    if (todayHours.length === 0) {
      return false;
    }

    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    return todayHours.some(
      (oh) => !oh.isClosed && currentTime >= oh.openTime && currentTime < oh.closeTime
    );
  }

  /**
   * Returns a new StoreModel with isActive = true.
   */
  activate(): StoreModel {
    if (this.isActive) {
      return this;
    }
    return new StoreModel({ ...this.toData(), isActive: true, updatedAt: new Date() });
  }

  /**
   * Returns a new StoreModel with isActive = false.
   */
  deactivate(): StoreModel {
    if (!this.isActive) {
      return this;
    }
    return new StoreModel({ ...this.toData(), isActive: false, updatedAt: new Date() });
  }

  // ---------------------------------------------------------------------------
  // Immutable updates
  // ---------------------------------------------------------------------------

  /**
   * Returns a new StoreModel with the updated name.
   */
  updateName(name: string): StoreModel {
    StoreModel.validateName(name);
    return new StoreModel({ ...this.toData(), name, updatedAt: new Date() });
  }

  /**
   * Returns a new StoreModel with the updated slug.
   */
  updateSlug(slug: string): StoreModel {
    StoreModel.validateSlug(slug);
    return new StoreModel({ ...this.toData(), slug, updatedAt: new Date() });
  }

  /**
   * Returns a new StoreModel with the updated address.
   */
  updateAddress(address: Address): StoreModel {
    return new StoreModel({ ...this.toData(), address, updatedAt: new Date() });
  }

  /**
   * Returns a new StoreModel with updated operating hours.
   */
  updateOperatingHours(hours: OperatingHours[]): StoreModel {
    return new StoreModel({
      ...this.toData(),
      operatingHours: hours,
      updatedAt: new Date(),
    });
  }

  /**
   * Returns a new StoreModel with merged metadata.
   */
  updateMetadata(metadata: Record<string, unknown>): StoreModel {
    return new StoreModel({
      ...this.toData(),
      metadata: { ...this.metadata, ...metadata },
      updatedAt: new Date(),
    });
  }

  // ---------------------------------------------------------------------------
  // Serialization
  // ---------------------------------------------------------------------------

  /**
   * Returns a plain object conforming to the Store interface.
   * Useful for persistence or serialization.
   */
  toData(): Store {
    return {
      id: this.id,
      vendorProfileId: this.vendorProfileId,
      name: this.name,
      description: this.description,
      email: this.email,
      phoneNumber: this.phoneNumber,
      phoneCountryCode: this.phoneCountryCode,
      address: this.address,
      slug: this.slug,
      storeType: this.storeType,
      isActive: this.isActive,
      operatingHours: this.operatingHours,
      metadata: this.metadata,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
