import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
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
import type { StoreRepository } from '@ecomsaas/application/ports';
import type { AuthUser } from '../auth/types/auth-user';
import { STORE_REPOSITORY } from './store.tokens';
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
    @Inject(STORE_REPOSITORY) private readonly storeRepository: StoreRepository
  ) {}

  async create(input: CreateStoreInput): Promise<StoreResponse> {
    const result = await this.createStore.execute(input);

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
    this.assertOwnership(store, user);
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

  private assertOwnership(store: StoreModel, user: AuthUser): void {
    if (user.role !== 'Admin' && store.vendorProfileId !== user.id) {
      throw new ForbiddenException('You do not own this store');
    }
  }

  private async verifyStoreOwnership(storeId: string, user: AuthUser): Promise<void> {
    if (user.role === 'Admin') return;
    const result = await this.storeRepository.findById(storeId);
    if (result.isErr()) throw result.error;
    this.assertOwnership(result.value, user);
  }

  private async getBySlug(slug: string) {
    const result = await this.getStore.execute({ identifier: slug, identifierType: 'slug' });

    if (result.isErr()) {
      throw result.error;
    }

    return result.value;
  }
}
