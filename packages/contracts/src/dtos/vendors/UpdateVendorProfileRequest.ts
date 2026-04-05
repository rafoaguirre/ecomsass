import type { TypedAddress } from '@ecomsaas/domain/value-objects';

export interface UpdateVendorProfileRequest {
  businessName?: string;
  phone?: string;
  phoneCountryCode?: string;
  addresses?: TypedAddress[];
  metadata?: Record<string, unknown>;
}
