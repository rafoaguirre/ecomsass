import { Inject, Injectable } from '@nestjs/common';
import {
  GetStore,
  CreateStore,
  UpdateStore,
  type CreateStoreInput,
  type UpdateStoreInput,
} from '@ecomsaas/application/use-cases';
import { NotFoundError } from '@ecomsaas/domain';
import type {
  PublicStoreResponse,
  StoreResponse,
  StoreSummary,
  StoreListResponse,
  StoreSearchQuery,
} from '@ecomsaas/contracts';
import type { StoreRepository } from '@ecomsaas/application/ports';
import type { AuthUser } from '../auth/types/auth-user';
import { STORE_REPOSITORY } from './store.tokens';
import { OwnershipVerifier } from '../common/authorization/ownership-verifier';
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
    private readonly ownership: OwnershipVerifier
  ) {}

  async createForUser(
    input: Omit<CreateStoreInput, 'vendorProfileId'>,
    user: AuthUser
  ): Promise<StoreResponse> {
    const vendorProfileId = await this.ownership.resolveVendorProfileId(user);
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
    await this.ownership.assertStoreOwnership(store, user);
    return toStoreResponse(store);
  }

  async update(input: UpdateStoreInput, user: AuthUser): Promise<StoreResponse> {
    await this.ownership.verifyStoreOwnership(input.id, user);
    const result = await this.updateStore.execute(input);

    if (result.isErr()) {
      throw result.error;
    }

    return toStoreResponse(result.value);
  }

  async remove(id: string, user: AuthUser): Promise<void> {
    await this.ownership.verifyStoreOwnership(id, user);
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

  private async getBySlug(slug: string) {
    const result = await this.getStore.execute({ identifier: slug, identifierType: 'slug' });

    if (result.isErr()) {
      throw result.error;
    }

    return result.value;
  }
}
