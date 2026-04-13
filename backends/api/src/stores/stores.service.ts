import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  GetStore,
  CreateStore,
  UpdateStore,
  type CreateStoreInput,
  type UpdateStoreInput,
} from '@ecomsaas/application/use-cases';
import { NotFoundError } from '@ecomsaas/domain';
import type { StoreModel } from '@ecomsaas/domain';
import type {
  PublicStoreResponse,
  StoreResponse,
  StoreSummary,
  StoreListResponse,
  StoreSearchQuery,
} from '@ecomsaas/contracts';
import type { StoreRepository, VendorProfileRepository } from '@ecomsaas/application/ports';
import type { AuthUser } from '../auth/types/auth-user';
import { STORE_REPOSITORY } from './store.tokens';
import { VENDOR_PROFILE_REPOSITORY } from '../vendors/vendor.tokens';
import {
  toPublicStoreResponse,
  toStoreResponse,
  toStoreSummary,
  toStoreListResponse,
} from './dto/store.mapper';
import { clampOffset, clampPageSize } from '../common/database';

@Injectable()
export class StoresService {
  constructor(
    @Inject(GetStore) private readonly getStore: GetStore,
    @Inject(CreateStore) private readonly createStore: CreateStore,
    @Inject(UpdateStore) private readonly updateStore: UpdateStore,
    @Inject(STORE_REPOSITORY) private readonly storeRepository: StoreRepository,
    @Inject(VENDOR_PROFILE_REPOSITORY)
    private readonly vendorProfileRepository: VendorProfileRepository
  ) {}

  async createForUser(
    input: Omit<CreateStoreInput, 'vendorProfileId'>,
    user: AuthUser
  ): Promise<StoreResponse> {
    const vendorProfileId = await this.resolveVendorProfileId(user);
    const result = await this.createStore.execute({ ...input, vendorProfileId });

    if (result.isErr()) {
      throw result.error;
    }

    return toStoreResponse(result.value);
  }

  async getByIdPublic(id: string): Promise<PublicStoreResponse> {
    const result = await this.getStore.execute({ identifier: id, identifierType: 'id' });

    if (result.isErr()) {
      throw result.error;
    }

    if (!result.value.isActive) {
      throw new NotFoundError('Store', id);
    }

    return toPublicStoreResponse(result.value);
  }

  async getBySlugPublic(slug: string): Promise<PublicStoreResponse> {
    const store = await this.getBySlug(slug);

    if (!store.isActive) {
      throw new NotFoundError('Store', slug);
    }

    return toPublicStoreResponse(store);
  }

  async getBySlugForVendor(slug: string, user: AuthUser): Promise<StoreResponse> {
    const store = await this.getBySlug(slug);
    await this.assertOwnership(store, user);
    return toStoreResponse(store);
  }

  async update(input: UpdateStoreInput, user: AuthUser): Promise<StoreResponse> {
    await this.verifyStoreOwnership(input.id, user);
    const result = await this.updateStore.execute(input);

    if (result.isErr()) {
      throw result.error;
    }

    return toStoreResponse(result.value);
  }

  async remove(id: string, user: AuthUser): Promise<void> {
    await this.verifyStoreOwnership(id, user);
    const result = await this.storeRepository.delete(id);

    if (result.isErr()) {
      throw result.error;
    }
  }

  async listForMarketplace(query?: StoreSearchQuery): Promise<StoreListResponse> {
    const offset = clampOffset(query?.offset);
    const limit = clampPageSize(query?.limit);
    const { data, total } = await this.storeRepository.searchActive({
      q: query?.q,
      storeType: query?.storeType,
      sortBy: query?.sortBy,
      sortDirection: query?.sortDirection,
      offset,
      limit,
    });
    return toStoreListResponse(data, total, offset, limit);
  }

  async listByVendor(vendorProfileId: string): Promise<StoreSummary[]> {
    const stores = await this.storeRepository.findByVendorId(vendorProfileId);
    return stores.map(toStoreSummary);
  }

  private async assertOwnership(store: StoreModel, user: AuthUser): Promise<void> {
    if (user.role === 'Admin') return;
    const vendorProfileId = await this.resolveVendorProfileId(user);
    if (store.vendorProfileId !== vendorProfileId) {
      throw new ForbiddenException('You do not own this store');
    }
  }

  private async verifyStoreOwnership(storeId: string, user: AuthUser): Promise<void> {
    if (user.role === 'Admin') return;
    const result = await this.storeRepository.findById(storeId);
    if (result.isErr()) throw result.error;
    await this.assertOwnership(result.value, user);
  }

  private async resolveVendorProfileId(user: AuthUser): Promise<string> {
    const result = await this.vendorProfileRepository.findByUserId(user.id);
    if (result.isErr()) {
      throw new NotFoundException('Vendor profile not found for this user');
    }
    return result.value.id;
  }

  private async getBySlug(slug: string) {
    const result = await this.getStore.execute({ identifier: slug, identifierType: 'slug' });

    if (result.isErr()) {
      throw result.error;
    }

    return result.value;
  }
}
