import type { NotFoundError } from '@ecomsaas/domain';
import { StoreModel, ValidationError, type Result, ok, err } from '@ecomsaas/domain';
import type { StoreType } from '@ecomsaas/domain/enums';
import type { Address, OperatingHours } from '@ecomsaas/domain/value-objects';
import type { StoreRepository } from '../../ports';

export interface UpdateStoreInput {
  id: string;
  name?: string;
  description?: string;
  email?: string;
  phoneNumber?: string;
  phoneCountryCode?: string;
  address?: Address;
  storeType?: StoreType;
  isActive?: boolean;
  operatingHours?: OperatingHours[];
  metadata?: Record<string, unknown>;
}

export class UpdateStore {
  constructor(private readonly storeRepository: StoreRepository) {}

  async execute(
    input: UpdateStoreInput
  ): Promise<Result<StoreModel, NotFoundError | ValidationError>> {
    const findResult = await this.storeRepository.findById(input.id);

    if (findResult.isErr()) {
      return err(findResult.error);
    }

    let store = findResult.value;

    if (input.name !== undefined) {
      store = store.updateName(input.name);
    }
    if (input.address !== undefined) {
      store = store.updateAddress(input.address);
    }
    if (input.operatingHours !== undefined) {
      store = store.updateOperatingHours(input.operatingHours);
    }
    if (input.metadata !== undefined) {
      store = store.updateMetadata(input.metadata);
    }
    if (input.isActive === true) {
      store = store.activate();
    } else if (input.isActive === false) {
      store = store.deactivate();
    }

    // Fields without dedicated domain methods — apply via fromData rebuild
    const needsRebuild =
      input.description !== undefined ||
      input.email !== undefined ||
      input.phoneNumber !== undefined ||
      input.phoneCountryCode !== undefined ||
      input.storeType !== undefined;

    if (needsRebuild) {
      store = StoreModel.fromData({
        id: store.id,
        vendorProfileId: store.vendorProfileId,
        name: store.name,
        slug: store.slug,
        storeType: input.storeType ?? store.storeType,
        description: input.description !== undefined ? input.description : store.description,
        email: input.email !== undefined ? input.email : store.email,
        phoneNumber: input.phoneNumber !== undefined ? input.phoneNumber : store.phoneNumber,
        phoneCountryCode:
          input.phoneCountryCode !== undefined ? input.phoneCountryCode : store.phoneCountryCode,
        address: store.address,
        isActive: store.isActive,
        operatingHours: store.operatingHours,
        metadata: store.metadata,
        createdAt: store.createdAt,
        updatedAt: new Date(),
      });
    }

    const saveResult = await this.storeRepository.save(store);

    if (saveResult.isErr()) {
      return err(new ValidationError(saveResult.error.message));
    }

    return ok(saveResult.value);
  }
}
