import type { StoreType } from '@ecomsaas/domain/enums';
import type { Address, OperatingHours } from '@ecomsaas/domain/value-objects';

/**
 * Store response
 */
export interface StoreResponse {
  id: string;
  vendorProfileId: string;
  name: string;
  description?: string;
  email?: string;
  phoneNumber?: string;
  phoneCountryCode?: string;
  address: Address;
  slug: string;
  storeType: StoreType;
  isActive: boolean;
  operatingHours?: OperatingHours[];
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  vendorName: string;
  productCount?: number;
  orderCount?: number;
}

/**
 * Store summary for lists
 */
export interface StoreSummary {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
}
