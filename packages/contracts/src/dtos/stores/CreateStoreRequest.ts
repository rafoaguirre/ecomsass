import type { StoreType } from '@ecomsaas/domain/enums';
import type { Address, OperatingHours } from '@ecomsaas/domain/value-objects';

/**
 * Create store request
 */
export interface CreateStoreRequest {
  name: string;
  description?: string;
  email?: string;
  phoneNumber?: string;
  phoneCountryCode?: string;
  address: Address;
  slug: string;
  storeType: StoreType;
  operatingHours?: OperatingHours[];
  metadata?: Record<string, unknown>;
}
