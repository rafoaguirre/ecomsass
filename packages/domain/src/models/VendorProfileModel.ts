import type { VendorProfile } from '../entities/identity/VendorProfile';
import { VerificationStatus } from '../enums';
import type { TypedAddress } from '../value-objects';
import { AggregateRoot } from '../core';
import { validateRequired } from './validation';

export interface CreateVendorProfileInput {
  id: string;
  userId: string;
  businessName: string;
  phone?: string;
  phoneCountryCode?: string;
  addresses?: TypedAddress[];
  verificationStatus?: VerificationStatus;
  metadata?: Record<string, unknown>;
}

export class VendorProfileModel extends AggregateRoot<VendorProfile> implements VendorProfile {
  get userId(): string {
    return this.props.userId;
  }
  get businessName(): string {
    return this.props.businessName;
  }
  get phone(): string | undefined {
    return this.props.phone;
  }
  get phoneCountryCode(): string | undefined {
    return this.props.phoneCountryCode;
  }
  get addresses(): TypedAddress[] {
    return this.props.addresses;
  }
  get verificationStatus(): VerificationStatus {
    return this.props.verificationStatus;
  }
  get stripeConnectId(): string | undefined {
    return this.props.stripeConnectId;
  }
  get agreementAccepted(): boolean {
    return this.props.agreementAccepted;
  }
  get onboardingCompleted(): boolean {
    return this.props.onboardingCompleted;
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

  private constructor(props: VendorProfile) {
    super(props);
    this.validate();
  }

  static create(input: CreateVendorProfileInput): VendorProfileModel {
    const now = new Date();
    return new VendorProfileModel({
      ...input,
      addresses: input.addresses ?? [],
      verificationStatus: input.verificationStatus ?? VerificationStatus.Unverified,
      stripeConnectId: undefined,
      agreementAccepted: false,
      onboardingCompleted: false,
      metadata: input.metadata ?? {},
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromData(data: VendorProfile): VendorProfileModel {
    return new VendorProfileModel(data);
  }

  private validate(): void {
    validateRequired(this.businessName, 'Vendor business name');
    validateRequired(this.userId, 'Vendor user ID');
  }

  private withUpdates(updates: Partial<VendorProfile>): VendorProfileModel {
    return new VendorProfileModel({ ...this.props, ...updates, updatedAt: new Date() });
  }

  updateBusinessName(businessName: string): VendorProfileModel {
    return this.withUpdates({ businessName });
  }

  updateAddresses(addresses: TypedAddress[]): VendorProfileModel {
    return this.withUpdates({ addresses });
  }

  completeOnboarding(): VendorProfileModel {
    return this.withUpdates({ onboardingCompleted: true });
  }

  acceptAgreement(): VendorProfileModel {
    return this.withUpdates({ agreementAccepted: true });
  }

  updateVerificationStatus(status: VerificationStatus): VendorProfileModel {
    return this.withUpdates({ verificationStatus: status });
  }
}
