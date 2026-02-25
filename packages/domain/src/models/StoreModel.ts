import type { Store } from '../entities/Store';
import type { Address, OperatingHours } from '../value-objects';
import type { StoreType } from '../enums';
import { AggregateRoot } from '../core';
import {
  validateRequired,
  validateSlug,
  validateMinLength,
  validateMaxLength,
  validateEmail,
} from './validation';

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

const MAX_NAME_LENGTH = 100;
const MIN_SLUG_LENGTH = 3;
const MAX_SLUG_LENGTH = 50;

/**
 * Rich domain model for Store aggregate root.
 *
 * Extends AggregateRoot for identity equality and domain-event support.
 * Implements the Store interface via getters delegating to the props bag.
 * All mutations return a new StoreModel instance (immutable).
 */
export class StoreModel extends AggregateRoot<Store> implements Store {
  // --- Property accessors (delegate to props) --------------------------------

  get vendorProfileId(): string {
    return this.props.vendorProfileId;
  }
  get name(): string {
    return this.props.name;
  }
  get description(): string | undefined {
    return this.props.description;
  }
  get email(): string | undefined {
    return this.props.email;
  }
  get phoneNumber(): string | undefined {
    return this.props.phoneNumber;
  }
  get phoneCountryCode(): string | undefined {
    return this.props.phoneCountryCode;
  }
  get address(): Address {
    return this.props.address;
  }
  get slug(): string {
    return this.props.slug;
  }
  get storeType(): StoreType {
    return this.props.storeType;
  }
  get isActive(): boolean {
    return this.props.isActive;
  }
  get operatingHours(): OperatingHours[] | undefined {
    return this.props.operatingHours;
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

  private constructor(props: Store) {
    super(props);
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
  // Validation (single source of truth — runs in constructor)
  // ---------------------------------------------------------------------------

  private validate(): void {
    validateRequired(this.name, 'Store name');
    validateMaxLength(this.name, MAX_NAME_LENGTH, 'Store name');
    validateMinLength(this.slug, MIN_SLUG_LENGTH, 'Store slug');
    validateMaxLength(this.slug, MAX_SLUG_LENGTH, 'Store slug');
    validateSlug(this.slug, 'Store');

    if (this.email !== undefined && this.email !== '') {
      validateEmail(this.email, 'Store email');
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
    return this.withUpdates({ isActive: true });
  }

  /**
   * Returns a new StoreModel with isActive = false.
   */
  deactivate(): StoreModel {
    if (!this.isActive) {
      return this;
    }
    return this.withUpdates({ isActive: false });
  }

  // ---------------------------------------------------------------------------
  // Immutable updates (withUpdates handles timestamp + re-validation)
  // ---------------------------------------------------------------------------

  private withUpdates(updates: Partial<Store>): StoreModel {
    return new StoreModel({ ...this.props, ...updates, updatedAt: new Date() });
  }

  /** Returns a new StoreModel with the updated name. */
  updateName(name: string): StoreModel {
    return this.withUpdates({ name });
  }

  /** Returns a new StoreModel with the updated slug. */
  updateSlug(slug: string): StoreModel {
    return this.withUpdates({ slug });
  }

  /** Returns a new StoreModel with the updated address. */
  updateAddress(address: Address): StoreModel {
    return this.withUpdates({ address });
  }

  /** Returns a new StoreModel with updated operating hours. */
  updateOperatingHours(hours: OperatingHours[]): StoreModel {
    return this.withUpdates({ operatingHours: hours });
  }

  /** Returns a new StoreModel with merged metadata. */
  updateMetadata(metadata: Record<string, unknown>): StoreModel {
    return this.withUpdates({ metadata: { ...this.metadata, ...metadata } });
  }
}
