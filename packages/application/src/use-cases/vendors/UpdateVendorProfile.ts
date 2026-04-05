import type { NotFoundError } from '@ecomsaas/domain';
import { VendorProfileModel, ValidationError, type Result, ok, err } from '@ecomsaas/domain';
import type { TypedAddress } from '@ecomsaas/domain/value-objects';
import type { VendorProfileRepository } from '../../ports';

export interface UpdateVendorProfileInput {
  id: string;
  businessName?: string;
  phone?: string;
  phoneCountryCode?: string;
  addresses?: TypedAddress[];
  metadata?: Record<string, unknown>;
}

export class UpdateVendorProfile {
  constructor(private readonly vendorProfileRepository: VendorProfileRepository) {}

  async execute(
    input: UpdateVendorProfileInput
  ): Promise<Result<VendorProfileModel, NotFoundError | ValidationError>> {
    const findResult = await this.vendorProfileRepository.findById(input.id);

    if (findResult.isErr()) {
      return err(findResult.error);
    }

    let profile = findResult.value;

    if (input.businessName !== undefined) {
      profile = profile.updateBusinessName(input.businessName);
    }

    if (input.addresses !== undefined) {
      profile = profile.updateAddresses(input.addresses);
    }

    // Fields without dedicated domain methods — apply via fromData rebuild
    const needsRebuild =
      input.phone !== undefined ||
      input.phoneCountryCode !== undefined ||
      input.metadata !== undefined;

    if (needsRebuild) {
      profile = VendorProfileModel.fromData({
        id: profile.id,
        userId: profile.userId,
        businessName: profile.businessName,
        phone: input.phone !== undefined ? input.phone : profile.phone,
        phoneCountryCode:
          input.phoneCountryCode !== undefined ? input.phoneCountryCode : profile.phoneCountryCode,
        addresses: profile.addresses,
        verificationStatus: profile.verificationStatus,
        stripeConnectId: profile.stripeConnectId,
        agreementAccepted: profile.agreementAccepted,
        onboardingCompleted: profile.onboardingCompleted,
        metadata: input.metadata ?? profile.metadata,
        createdAt: profile.createdAt,
        updatedAt: new Date(),
      });
    }

    const saveResult = await this.vendorProfileRepository.save(profile);

    if (saveResult.isErr()) {
      return err(new ValidationError(saveResult.error.message));
    }

    return ok(saveResult.value);
  }
}
