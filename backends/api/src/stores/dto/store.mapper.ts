import type { StoreResponse, StoreSummary } from '@ecomsaas/contracts';
import type { StoreModel } from '@ecomsaas/domain';

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

export function toStoreResponse(store: StoreModel): StoreResponse {
  return {
    id: store.id,
    vendorProfileId: store.vendorProfileId,
    name: store.name,
    description: store.description,
    email: store.email,
    phoneNumber: store.phoneNumber,
    phoneCountryCode: store.phoneCountryCode,
    address: store.address,
    slug: store.slug,
    storeType: store.storeType,
    isActive: store.isActive,
    operatingHours: store.operatingHours,
    metadata: store.metadata,
    createdAt: store.createdAt,
    updatedAt: store.updatedAt,
    vendorName: asString(store.metadata.vendorName) ?? 'Unknown Vendor',
  };
}

export function toStoreSummary(store: StoreModel): StoreSummary {
  return {
    id: store.id,
    name: store.name,
    slug: store.slug,
    isActive: store.isActive,
  };
}
