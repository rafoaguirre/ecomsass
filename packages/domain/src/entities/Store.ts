import type { StoreType } from '../enums';
import type { Address, OperatingHours } from '../value-objects';

/**
 * Store entity
 * Represents a physical or virtual store location owned by a vendor
 */
export interface Store {
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
}
