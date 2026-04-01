import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { GetStore } from '@ecomsaas/application/use-cases';
import { NotFoundError } from '@ecomsaas/domain';
import type { StoreResponse } from '@ecomsaas/contracts';
import { toStoreResponse } from './dto/store.mapper';

@Injectable()
export class StoresService {
  constructor(@Inject(GetStore) private readonly getStore: GetStore) {}

  async getBySlugPublic(slug: string): Promise<StoreResponse> {
    const store = await this.getBySlug(slug);

    if (!store.isActive) {
      throw new NotFoundException(`Store with slug '${slug}' not found`);
    }

    return toStoreResponse(store);
  }

  async getBySlugForVendor(slug: string): Promise<StoreResponse> {
    const store = await this.getBySlug(slug);
    return toStoreResponse(store);
  }

  private async getBySlug(slug: string) {
    const result = await this.getStore.execute({ identifier: slug, identifierType: 'slug' });

    if (result.isErr()) {
      if (result.error instanceof NotFoundError) {
        throw new NotFoundException(result.error.message);
      }

      throw result.error;
    }

    return result.value;
  }
}
