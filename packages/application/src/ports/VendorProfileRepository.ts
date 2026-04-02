import type { VendorProfileModel, Result, NotFoundError } from '@ecomsaas/domain';

export interface VendorProfileRepository {
  findById(id: string): Promise<Result<VendorProfileModel, NotFoundError>>;

  findByUserId(userId: string): Promise<Result<VendorProfileModel, NotFoundError>>;

  save(profile: VendorProfileModel): Promise<Result<VendorProfileModel, Error>>;
}
