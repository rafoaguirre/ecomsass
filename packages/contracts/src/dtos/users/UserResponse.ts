import type {
  AccountTier,
  AccountStatus,
  UserRole,
  VerificationStatus,
} from '@ecomsaas/domain/enums';

export interface UserResponse {
  id: string;
  email: string;
  fullName: string;
  defaultLocale: string;
  accountTier: AccountTier;
  accountStatus: AccountStatus;
  role: UserRole;
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
