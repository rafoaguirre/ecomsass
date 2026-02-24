import type { AccountTier, AccountStatus, UserRole, VerificationStatus } from '../../enums';

/**
 * User account entity
 * Represents a user's business identity (not authentication credentials)
 */
export interface UserAccount {
  id: string;
  email: string;
  fullName: string;
  defaultLocale: string;
  accountTier: AccountTier;
  accountStatus: AccountStatus;
  role: UserRole;
  stripeCustomerId: string | null;
  marketingConsent: boolean;
  agreementAccepted: boolean;
  verificationStatus: VerificationStatus;
  preferences: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    marketingEmails: boolean;
  };
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}
