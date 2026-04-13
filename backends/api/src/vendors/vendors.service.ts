import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import {
  GetVendorProfile,
  CreateVendorProfile,
  UpdateVendorProfile,
  type CreateVendorProfileInput,
  type UpdateVendorProfileInput,
} from '@ecomsaas/application/use-cases';
import type { VendorProfileRepository } from '@ecomsaas/application/ports';
import type { VendorProfileResponse } from '@ecomsaas/contracts';
import type { AuthUser } from '../auth/types/auth-user';
import { VENDOR_PROFILE_REPOSITORY } from './vendor.tokens';
import { toVendorProfileResponse } from './dto/vendor-profile.mapper';

@Injectable()
export class VendorsService {
  constructor(
    @Inject(GetVendorProfile) private readonly getVendorProfile: GetVendorProfile,
    @Inject(CreateVendorProfile) private readonly createVendorProfile: CreateVendorProfile,
    @Inject(UpdateVendorProfile) private readonly updateVendorProfile: UpdateVendorProfile,
    @Inject(VENDOR_PROFILE_REPOSITORY)
    private readonly vendorProfileRepository: VendorProfileRepository
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

  /**
   * Idempotent vendor profile setup: returns existing profile or creates a new one.
   */
  async ensureProfile(userId: string, businessName: string): Promise<VendorProfileResponse> {
    const existing = await this.getVendorProfile.execute({
      identifier: userId,
      identifierType: 'userId',
    });

    if (existing.isOk()) {
      return toVendorProfileResponse(existing.value);
    }

    return this.create({ userId, businessName });
  }

  /**
   * Mark vendor onboarding as complete.
   */
  async markOnboardingComplete(userId: string): Promise<void> {
    const result = await this.vendorProfileRepository.findByUserId(userId);
    if (result.isErr()) return; // nothing to mark

    const profile = result.value;
    if (profile.onboardingCompleted) return;

    const updated = profile.completeOnboarding();
    await this.vendorProfileRepository.save(updated);
  }
}
