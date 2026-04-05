import type { VerificationStatus } from '@ecomsaas/domain/enums';
import type { TypedAddress } from '@ecomsaas/domain/value-objects';

export interface VendorProfileResponse {
  id: string;
  userId: string;
  businessName: string;
  phone?: string;
  phoneCountryCode?: string;
  addresses: TypedAddress[];
  verificationStatus: VerificationStatus;
  agreementAccepted: boolean;
  onboardingCompleted: boolean;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}
