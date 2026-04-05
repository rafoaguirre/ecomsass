import { StoreType, ProductAvailability, ProductModel } from '@ecomsaas/domain';
import type { Store, UserAccount, VendorProfile } from '@ecomsaas/domain';
import { AccountTier, AccountStatus, UserRole, VerificationStatus } from '@ecomsaas/domain';

let counter = 0;

function nextId(prefix = 'test'): string {
  counter++;
  return `${prefix}-${String(counter).padStart(4, '0')}`;
}

/** Reset the auto-increment counter between test suites. */
export function resetFactories(): void {
  counter = 0;
}

/** Build a plain Store entity with sensible defaults. Override any field. */
export function buildStore(overrides: Partial<Store> = {}): Store {
  const id = overrides.id ?? nextId('store');
  return {
    id,
    vendorProfileId: overrides.vendorProfileId ?? nextId('vendor'),
    name: overrides.name ?? 'Test Store',
    slug: overrides.slug ?? `test-store-${id}`,
    storeType: overrides.storeType ?? StoreType.General,
    address: overrides.address ?? {
      street: '123 Main St',
      city: 'Halifax',
      province: 'NS',
      country: 'CA',
      postalCode: 'B3H1A1',
    },
    metadata: overrides.metadata ?? { vendorName: 'Test Vendor' },
    isActive: overrides.isActive ?? true,
    createdAt: overrides.createdAt ?? new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: overrides.updatedAt ?? new Date('2026-01-01T00:00:00.000Z'),
    ...(overrides.description !== undefined && { description: overrides.description }),
    ...(overrides.email !== undefined && { email: overrides.email }),
    ...(overrides.phoneNumber !== undefined && { phoneNumber: overrides.phoneNumber }),
    ...(overrides.phoneCountryCode !== undefined && {
      phoneCountryCode: overrides.phoneCountryCode,
    }),
    ...(overrides.operatingHours !== undefined && { operatingHours: overrides.operatingHours }),
  };
}

/** Build a ProductModel with sensible defaults. Override any field. */
export function buildProduct(
  overrides: Partial<Parameters<typeof ProductModel.create>[0]> = {}
): ProductModel {
  const id = overrides.id ?? nextId('prod');
  return ProductModel.create({
    id,
    storeId: overrides.storeId ?? nextId('store'),
    name: overrides.name ?? 'Test Product',
    slug: overrides.slug ?? `test-product-${id}`,
    price: overrides.price ?? { amount: BigInt(1000), currency: 'CAD' },
    description: overrides.description,
    compareAtPrice: overrides.compareAtPrice,
    images: overrides.images ?? [],
    categoryId: overrides.categoryId,
    supplierId: overrides.supplierId,
    availability: overrides.availability ?? ProductAvailability.Available,
    inventory: overrides.inventory,
    variants: overrides.variants,
    tags: overrides.tags ?? [],
    metadata: overrides.metadata ?? {},
  });
}

/** Build a plain UserAccount entity with sensible defaults. Override any field. */
export function buildUser(overrides: Partial<UserAccount> = {}): UserAccount {
  const id = overrides.id ?? nextId('user');
  return {
    id,
    email: overrides.email ?? `${id}@example.com`,
    fullName: overrides.fullName ?? 'Test User',
    defaultLocale: overrides.defaultLocale ?? 'en',
    accountTier: overrides.accountTier ?? AccountTier.GeneralUser,
    accountStatus: overrides.accountStatus ?? AccountStatus.Active,
    role: overrides.role ?? UserRole.Customer,
    stripeCustomerId: overrides.stripeCustomerId ?? null,
    marketingConsent: overrides.marketingConsent ?? false,
    agreementAccepted: overrides.agreementAccepted ?? false,
    verificationStatus: overrides.verificationStatus ?? VerificationStatus.Unverified,
    preferences: overrides.preferences ?? {
      emailNotifications: true,
      smsNotifications: false,
      marketingEmails: false,
    },
    metadata: overrides.metadata ?? {},
    createdAt: overrides.createdAt ?? new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: overrides.updatedAt ?? new Date('2026-01-01T00:00:00.000Z'),
  };
}

/** Build a plain VendorProfile entity with sensible defaults. Override any field. */
export function buildVendorProfile(overrides: Partial<VendorProfile> = {}): VendorProfile {
  const id = overrides.id ?? nextId('vendor');
  return {
    id,
    userId: overrides.userId ?? nextId('user'),
    businessName: overrides.businessName ?? 'Test Business',
    phone: overrides.phone,
    phoneCountryCode: overrides.phoneCountryCode,
    addresses: overrides.addresses ?? [],
    verificationStatus: overrides.verificationStatus ?? VerificationStatus.Unverified,
    stripeConnectId: overrides.stripeConnectId,
    agreementAccepted: overrides.agreementAccepted ?? false,
    onboardingCompleted: overrides.onboardingCompleted ?? false,
    metadata: overrides.metadata ?? {},
    createdAt: overrides.createdAt ?? new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: overrides.updatedAt ?? new Date('2026-01-01T00:00:00.000Z'),
  };
}
