import type { AddressType } from '../enums';

/**
 * Address value object
 */
export interface Address {
  street: string;
  street2?: string;
  city: string;
  province: string;
  country: string;
  postalCode: string;
}

/**
 * Typed address with usage designation
 */
export interface TypedAddress {
  type: AddressType;
  address: Address;
}
