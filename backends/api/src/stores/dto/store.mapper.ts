import type {
  PublicStoreResponse,
  StoreResponse,
  StoreSummary,
  StoreListResponse,
} from '@ecomsaas/contracts';
import type { StoreModel } from '@ecomsaas/domain';

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

export function toPublicStoreResponse(store: StoreModel): PublicStoreResponse {
  return {
    id: store.id,
    name: store.name,
    description: store.description,
    address: store.address,
    slug: store.slug,
    storeType: store.storeType,
    isActive: store.isActive,
    operatingHours: store.operatingHours,
    vendorName: asString(store.metadata.vendorName) ?? 'Unknown Vendor',
    createdAt: store.createdAt,
    updatedAt: store.updatedAt,
  };
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
    description: store.description,
    slug: store.slug,
    storeType: store.storeType,
    isActive: store.isActive,
    vendorName: asString(store.metadata.vendorName) ?? 'Unknown Vendor',
  };
}

export function toStoreListResponse(
  stores: StoreModel[],
  total: number,
  offset: number,
  limit: number
): StoreListResponse {
  return {
    stores: stores.map(toStoreSummary),
    totalCount: total,
    hasMore: offset + limit < total,
  };
}
