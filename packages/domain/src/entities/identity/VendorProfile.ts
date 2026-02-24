import type { VerificationStatus } from '../../enums';
import type { TypedAddress } from '../../value-objects';

/**
 * Vendor profile entity
 * Contains vendor-specific business information
 */
export interface VendorProfile {
  id: string;
  userId: string;
  businessName: string;
  phone?: string;
  phoneCountryCode?: string;
  addresses: TypedAddress[];
  verificationStatus: VerificationStatus;
  stripeConnectId?: string;
  agreementAccepted: boolean;
  onboardingCompleted: boolean;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}
