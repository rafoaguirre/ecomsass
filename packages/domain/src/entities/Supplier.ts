import type { TypedAddress } from '../value-objects';

/**
 * Supplier entity
 */
export interface Supplier {
  id: string;
  storeId: string;
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  phoneCountryCode?: string;
  addresses: TypedAddress[];
  isActive: boolean;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}
