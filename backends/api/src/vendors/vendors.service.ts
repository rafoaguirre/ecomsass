import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import {
  GetVendorProfile,
  CreateVendorProfile,
  UpdateVendorProfile,
  type CreateVendorProfileInput,
  type UpdateVendorProfileInput,
} from '@ecomsaas/application/use-cases';
import type { VendorProfileResponse } from '@ecomsaas/contracts';
import type { AuthUser } from '../auth/types/auth-user';
import { toVendorProfileResponse } from './dto/vendor-profile.mapper';

@Injectable()
export class VendorsService {
  constructor(
    @Inject(GetVendorProfile) private readonly getVendorProfile: GetVendorProfile,
    @Inject(CreateVendorProfile) private readonly createVendorProfile: CreateVendorProfile,
    @Inject(UpdateVendorProfile) private readonly updateVendorProfile: UpdateVendorProfile
  ) {}

  async create(input: CreateVendorProfileInput): Promise<VendorProfileResponse> {
    const result = await this.createVendorProfile.execute(input);

    if (result.isErr()) {
      throw result.error;
    }

    return toVendorProfileResponse(result.value);
  }

  async getById(id: string, user: AuthUser): Promise<VendorProfileResponse> {
    const result = await this.getVendorProfile.execute({ identifier: id, identifierType: 'id' });

    if (result.isErr()) {
      throw result.error;
    }

    if (user.role !== 'Admin' && result.value.userId !== user.id) {
      throw new ForbiddenException('You do not own this vendor profile');
    }

    return toVendorProfileResponse(result.value);
  }

  async getByUserId(userId: string): Promise<VendorProfileResponse> {
    const result = await this.getVendorProfile.execute({
      identifier: userId,
      identifierType: 'userId',
    });

    if (result.isErr()) {
      throw result.error;
    }

    return toVendorProfileResponse(result.value);
  }

  async update(input: UpdateVendorProfileInput, user: AuthUser): Promise<VendorProfileResponse> {
    await this.verifyOwnership(input.id, user);
    const result = await this.updateVendorProfile.execute(input);

    if (result.isErr()) {
      throw result.error;
    }

    return toVendorProfileResponse(result.value);
  }

  private async verifyOwnership(profileId: string, user: AuthUser): Promise<void> {
    if (user.role === 'Admin') return;
    const result = await this.getVendorProfile.execute({
      identifier: profileId,
      identifierType: 'id',
    });
    if (result.isErr()) throw result.error;
    if (result.value.userId !== user.id) {
      throw new ForbiddenException('You do not own this vendor profile');
    }
  }
}
