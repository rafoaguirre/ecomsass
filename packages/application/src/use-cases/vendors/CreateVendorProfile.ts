import { VendorProfileModel, ValidationError, type Result, ok, err } from '@ecomsaas/domain';
import type { TypedAddress } from '@ecomsaas/domain/value-objects';
import type { VendorProfileRepository } from '../../ports';
import type { IdGenerator } from '../../ports';

export interface CreateVendorProfileInput {
  userId: string;
  businessName: string;
  phone?: string;
  phoneCountryCode?: string;
  addresses?: TypedAddress[];
  metadata?: Record<string, unknown>;
}

export class CreateVendorProfile {
  constructor(
    private readonly vendorProfileRepository: VendorProfileRepository,
    private readonly idGenerator: IdGenerator
  ) {}

  async execute(
    input: CreateVendorProfileInput
  ): Promise<Result<VendorProfileModel, ValidationError>> {
    // Check if user already has a vendor profile
    const existing = await this.vendorProfileRepository.findByUserId(input.userId);

    if (existing.isOk()) {
      return err(
        new ValidationError('User already has a vendor profile', {
          field: 'userId',
          value: input.userId,
        })
      );
    }

    const profile = VendorProfileModel.create({
      id: this.idGenerator.generate('vendor'),
      ...input,
    });

    const saveResult = await this.vendorProfileRepository.save(profile);

    if (saveResult.isErr()) {
      return err(new ValidationError(saveResult.error.message));
    }

    return ok(saveResult.value);
  }
}
