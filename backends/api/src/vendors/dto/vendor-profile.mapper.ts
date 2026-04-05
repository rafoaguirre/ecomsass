import type { VendorProfileResponse } from '@ecomsaas/contracts';
import type { VendorProfileModel } from '@ecomsaas/domain';

export function toVendorProfileResponse(profile: VendorProfileModel): VendorProfileResponse {
  return {
    id: profile.id,
    userId: profile.userId,
    businessName: profile.businessName,
    phone: profile.phone,
    phoneCountryCode: profile.phoneCountryCode,
    addresses: profile.addresses,
    verificationStatus: profile.verificationStatus,
    agreementAccepted: profile.agreementAccepted,
    onboardingCompleted: profile.onboardingCompleted,
    metadata: profile.metadata,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
}
