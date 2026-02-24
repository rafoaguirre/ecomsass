import type { StoreType } from '@ecomsaas/domain/enums';
import type { Address, OperatingHours } from '@ecomsaas/domain/value-objects';

/**
 * Update store request
 */
export interface UpdateStoreRequest {
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
