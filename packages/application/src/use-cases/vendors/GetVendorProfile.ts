import type { VendorProfileModel, Result, NotFoundError } from '@ecomsaas/domain';
import type { VendorProfileRepository } from '../../ports';

export interface GetVendorProfileInput {
  identifier: string;
  identifierType?: 'id' | 'userId';
}

export class GetVendorProfile {
  constructor(private readonly vendorProfileRepository: VendorProfileRepository) {}

  async execute(input: GetVendorProfileInput): Promise<Result<VendorProfileModel, NotFoundError>> {
    const { identifier, identifierType = 'id' } = input;

    if (identifierType === 'userId') {
      return this.vendorProfileRepository.findByUserId(identifier);
    }

    return this.vendorProfileRepository.findById(identifier);
  }
}
