import type { UserAccount } from '../entities/identity/UserAccount';
import { AccountTier, AccountStatus, type UserRole, VerificationStatus } from '../enums';
import { AggregateRoot } from '../core';
import { validateRequired, validateEmail } from './validation';

export interface CreateUserAccountInput {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  defaultLocale?: string;
  accountTier?: AccountTier;
  accountStatus?: AccountStatus;
  verificationStatus?: VerificationStatus;
  preferences?: UserAccount['preferences'];
  metadata?: Record<string, unknown>;
}

export class UserAccountModel extends AggregateRoot<UserAccount> implements UserAccount {
  get email(): string {
    return this.props.email;
  }
  get fullName(): string {
    return this.props.fullName;
  }
  get defaultLocale(): string {
    return this.props.defaultLocale;
  }
  get accountTier(): AccountTier {
    return this.props.accountTier;
  }
  get accountStatus(): AccountStatus {
    return this.props.accountStatus;
  }
  get role(): UserRole {
    return this.props.role;
  }
  get stripeCustomerId(): string | null {
    return this.props.stripeCustomerId;
  }
  get marketingConsent(): boolean {
    return this.props.marketingConsent;
  }
  get agreementAccepted(): boolean {
    return this.props.agreementAccepted;
  }
  get verificationStatus(): VerificationStatus {
    return this.props.verificationStatus;
  }
  get preferences(): UserAccount['preferences'] {
    return this.props.preferences;
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

  private constructor(props: UserAccount) {
    super(props);
    this.validate();
  }

  static create(input: CreateUserAccountInput): UserAccountModel {
    const now = new Date();
    return new UserAccountModel({
      ...input,
      defaultLocale: input.defaultLocale ?? 'en',
      accountTier: input.accountTier ?? AccountTier.GeneralUser,
      accountStatus: input.accountStatus ?? AccountStatus.Active,
      verificationStatus: input.verificationStatus ?? VerificationStatus.Unverified,
      stripeCustomerId: null,
      marketingConsent: false,
      agreementAccepted: false,
      preferences: input.preferences ?? {
        emailNotifications: true,
        smsNotifications: false,
        marketingEmails: false,
      },
      metadata: input.metadata ?? {},
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromData(data: UserAccount): UserAccountModel {
    return new UserAccountModel(data);
  }

  private validate(): void {
    validateRequired(this.email, 'User email');
    validateEmail(this.email, 'User email');
    validateRequired(this.fullName, 'User full name');
  }

  private withUpdates(updates: Partial<UserAccount>): UserAccountModel {
    return new UserAccountModel({ ...this.props, ...updates, updatedAt: new Date() });
  }

  updateFullName(fullName: string): UserAccountModel {
    return this.withUpdates({ fullName });
  }

  updateRole(role: UserRole): UserAccountModel {
    return this.withUpdates({ role });
  }

  updateAccountStatus(accountStatus: AccountStatus): UserAccountModel {
    return this.withUpdates({ accountStatus });
  }

  updatePreferences(preferences: Partial<UserAccount['preferences']>): UserAccountModel {
    return this.withUpdates({
      preferences: { ...this.preferences, ...preferences },
    });
  }
}
