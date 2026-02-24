/**
 * Business enums for the EcomSaaS platform
 * These mirror enums from yande/shared/domain for use in type-only contexts
 */

/**
 * User account tiers with associated capabilities
 */
export enum AccountTier {
  GeneralUser = 'GeneralUser',
  BasicMerchant = 'BasicMerchant',
  PlusMerchant = 'PlusMerchant',
  PremiumMerchant = 'PremiumMerchant',
  EnterpriseMerchant = 'EnterpriseMerchant',
  MarketplaceBasic = 'MarketplaceBasic',
  MarketplacePremium = 'MarketplacePremium',
}

/**
 * Account status enum
 */
export enum AccountStatus {
  Active = 'Active',
  Suspended = 'Suspended',
  Inactive = 'Inactive',
  Closed = 'Closed',
}

/**
 * User roles within the system
 */
export enum UserRole {
  Admin = 'Admin',
  Vendor = 'Vendor',
  Customer = 'Customer',
  Buyer = 'Buyer',
  Supplier = 'Supplier',
  ChildAccount = 'ChildAccount',
  SuperAdmin = 'SuperAdmin',
}

/**
 * Store access levels for staff members
 */
export enum StoreAccessLevel {
  Owner = 'Owner',
  Admin = 'Admin',
  Editor = 'Editor',
  Viewer = 'Viewer',
  Linked = 'Linked',
}

/**
 * Vendor verification status
 */
export enum VerificationStatus {
  Unverified = 'Unverified',
  Pending = 'Pending',
  Verified = 'Verified',
  Rejected = 'Rejected',
  Suspended = 'Suspended',
}

/**
 * Order status
 */
export enum OrderStatus {
  Draft = 'DRAFT',
  InCart = 'IN_CART',
  Placed = 'PLACED',
  Confirmed = 'CONFIRMED',
  Processing = 'PROCESSING',
  Packed = 'PACKED',
  InTransit = 'IN_TRANSIT',
  Delivered = 'DELIVERED',
  Completed = 'COMPLETED',
  Cancelled = 'CANCELLED',
  Refunded = 'REFUNDED',
  PartiallyRefunded = 'PARTIALLY_REFUNDED',
  Skipped = 'SKIPPED',
}

/**
 * Payment status
 */
export enum PaymentStatus {
  Pending = 'PENDING',
  Initiated = 'INITIATED',
  Processing = 'PROCESSING',
  Paid = 'PAID',
  PartiallyPaid = 'PARTIALLY_PAID',
  Failed = 'FAILED',
  Refunded = 'REFUNDED',
  PartiallyRefunded = 'PARTIALLY_REFUNDED',
  Cancelled = 'CANCELLED',
}

/**
 * Payment methods
 */
export enum PaymentMethod {
  Cash = 'CASH',
  Card = 'CARD',
  Stripe = 'STRIPE',
  Credit = 'CREDIT',
  BankTransfer = 'BANK_TRANSFER',
  Crypto = 'CRYPTO',
}

/**
 * Fulfillment types
 */
export enum FulfillmentType {
  Pickup = 'PICKUP',
  Delivery = 'DELIVERY',
  Shipping = 'SHIPPING',
}

/**
 * Subscription cadence/frequency
 */
export enum SubscriptionCadence {
  Daily = 'DAILY',
  Weekly = 'WEEKLY',
  Biweekly = 'BIWEEKLY',
  Monthly = 'MONTHLY',
  Quarterly = 'QUARTERLY',
  Annual = 'ANNUAL',
}

/**
 * Subscription status
 */
export enum SubscriptionStatus {
  Active = 'ACTIVE',
  Paused = 'PAUSED',
  Cancelled = 'CANCELLED',
  Expired = 'EXPIRED',
  PendingCancellation = 'PENDING_CANCELLATION',
}

/**
 * Product availability status
 */
export enum ProductAvailability {
  Available = 'AVAILABLE',
  OutOfStock = 'OUT_OF_STOCK',
  Discontinued = 'DISCONTINUED',
  ComingSoon = 'COMING_SOON',
  PreOrder = 'PRE_ORDER',
}

/**
 * Store types
 */
export enum StoreType {
  General = 'GENERAL',
  School = 'SCHOOL',
  Cafeteria = 'CAFETERIA',
  Events = 'EVENTS',
  Marketplace = 'MARKETPLACE',
}

/**
 * Address types
 */
export enum AddressType {
  Primary = 'PRIMARY',
  Billing = 'BILLING',
  Shipping = 'SHIPPING',
  Store = 'STORE',
  Pickup = 'PICKUP',
}

/**
 * Tax basis
 */
export enum TaxBasis {
  Country = 'COUNTRY',
  Region = 'REGION',
  Address = 'ADDRESS',
}

/**
 * Discount types
 */
export enum DiscountType {
  Percentage = 'PERCENTAGE',
  FixedAmount = 'FIXED_AMOUNT',
  FreeShipping = 'FREE_SHIPPING',
}

/**
 * Category types
 */
export enum CategoryType {
  Product = 'PRODUCT',
  Reporting = 'REPORTING',
  Classroom = 'CLASSROOM',
  Custom = 'CUSTOM',
}

/**
 * Day of week for schedules
 */
export enum DayOfWeek {
  Monday = 'MONDAY',
  Tuesday = 'TUESDAY',
  Wednesday = 'WEDNESDAY',
  Thursday = 'THURSDAY',
  Friday = 'FRIDAY',
  Saturday = 'SATURDAY',
  Sunday = 'SUNDAY',
}

/**
 * Social media platforms
 */
export enum SocialPlatform {
  Facebook = 'FACEBOOK',
  Instagram = 'INSTAGRAM',
  Twitter = 'TWITTER',
  TikTok = 'TIKTOK',
  LinkedIn = 'LINKEDIN',
}

/**
 * Content asset types
 */
export enum AssetType {
  Image = 'IMAGE',
  Video = 'VIDEO',
  Document = 'DOCUMENT',
}
