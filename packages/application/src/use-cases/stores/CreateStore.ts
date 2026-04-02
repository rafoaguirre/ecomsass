import { StoreModel, ValidationError, type Result, ok, err } from '@ecomsaas/domain';
import type { StoreType } from '@ecomsaas/domain/enums';
import type { Address, OperatingHours } from '@ecomsaas/domain/value-objects';
import type { StoreRepository } from '../../ports';
import type { IdGenerator } from '../../ports';

export interface CreateStoreInput {
  vendorProfileId: string;
  name: string;
  slug: string;
  storeType: StoreType;
  description?: string;
  email?: string;
  phoneNumber?: string;
  phoneCountryCode?: string;
  address?: Address;
  operatingHours?: OperatingHours[];
  metadata?: Record<string, unknown>;
}

export class CreateStore {
  constructor(
    private readonly storeRepository: StoreRepository,
    private readonly idGenerator: IdGenerator
  ) {}

  async execute(input: CreateStoreInput): Promise<Result<StoreModel, ValidationError>> {
    const slugTaken = await this.storeRepository.slugExists(input.slug);

    if (slugTaken) {
      return err(
        new ValidationError('Store slug is already in use', {
          field: 'slug',
          value: input.slug,
        })
      );
    }

    const store = StoreModel.create({
      id: this.idGenerator.generate('store'),
      ...input,
    });

    const saveResult = await this.storeRepository.save(store);

    if (saveResult.isErr()) {
      return err(new ValidationError(saveResult.error.message));
    }

    return ok(saveResult.value);
  }
}
