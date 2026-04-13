import { Injectable } from '@nestjs/common';
import type { CreateStoreRequest, StoreResponse } from '@ecomsaas/contracts';
import type { AuthUser } from '../auth/types/auth-user';
import { VendorsService } from '../vendors/vendors.service';
import { StoresService } from '../stores/stores.service';

@Injectable()
export class OnboardingService {
  constructor(
    private readonly vendorsService: VendorsService,
    private readonly storesService: StoresService
  ) {}

  /**
   * Complete vendor onboarding: ensure vendor profile exists, create store,
   * and mark onboarding as complete.
   */
  async onboardStore(input: CreateStoreRequest, user: AuthUser): Promise<StoreResponse> {
    // 1. Ensure vendor profile exists (idempotent — safe if trigger already created it)
    await this.vendorsService.ensureProfile(user.id, 'My Business');

    // 2. Create the store via domain layer
    const store = await this.storesService.createForUser(input, user);

    // 3. Mark onboarding complete
    await this.vendorsService.markOnboardingComplete(user.id);

    return store;
  }
}
