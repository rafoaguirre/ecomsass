import {
  AccountStatus,
  AccountTier,
  CategoryType,
  FulfillmentType,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  ProductAvailability,
  StoreAccessLevel,
  StoreType,
  SubscriptionCadence,
  SubscriptionPlanStatus,
  SubscriptionStatus,
  UserRole,
  VerificationStatus,
} from '@ecomsaas/domain';
import { z } from 'zod';
import {
  AddressSchema,
  ImageSchema,
  MoneySchema,
  OperatingHoursSchema,
  TypedAddressSchema,
} from './value-objects';
import {
  EmailSchema,
  IdSchema,
  MetadataSchema,
  PhoneSchema,
  SlugSchema,
  TimestampSchema,
} from './common';

export const StoreSchema = z.object({
  id: IdSchema,
  vendorProfileId: IdSchema,
  name: z.string().min(1),
  description: z.string().optional(),
  email: EmailSchema.optional(),
  phoneNumber: PhoneSchema.optional(),
  phoneCountryCode: z.string().optional(),
  address: AddressSchema,
  slug: SlugSchema,
  storeType: z.nativeEnum(StoreType),
  isActive: z.boolean(),
  operatingHours: z.array(OperatingHoursSchema).optional(),
  metadata: MetadataSchema,
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
});

export const ProductVariantSchema = z.object({
  id: IdSchema,
  name: z.string().min(1),
  sku: z.string().optional(),
  price: MoneySchema.optional(),
  inventory: z
    .object({
      quantity: z.number().int().nonnegative(),
      trackQuantity: z.boolean(),
    })
    .optional(),
  attributes: z.record(z.string(), z.string()),
});

export const ProductSchema = z.object({
  id: IdSchema,
  storeId: IdSchema,
  name: z.string().min(1),
  slug: SlugSchema,
  description: z.string().optional(),
  price: MoneySchema,
  compareAtPrice: MoneySchema.optional(),
  images: z.array(ImageSchema),
  categoryId: IdSchema.optional(),
  supplierId: IdSchema.optional(),
  availability: z.nativeEnum(ProductAvailability),
  inventory: z
    .object({
      quantity: z.number().int().nonnegative(),
      trackQuantity: z.boolean(),
      lowStockThreshold: z.number().int().nonnegative().optional(),
    })
    .optional(),
  variants: z.array(ProductVariantSchema).optional(),
  tags: z.array(z.string()),
  metadata: MetadataSchema,
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
});

export const OrderItemSchema = z.object({
  id: IdSchema,
  productId: IdSchema,
  productName: z.string().min(1),
  variantId: IdSchema.optional(),
  variantName: z.string().optional(),
  quantity: z.number().int().positive(),
  unitPrice: MoneySchema,
  subtotal: MoneySchema,
  discount: MoneySchema.optional(),
  total: MoneySchema,
  metadata: MetadataSchema.optional(),
});

export const PaymentInfoSchema = z.object({
  method: z.nativeEnum(PaymentMethod),
  status: z.nativeEnum(PaymentStatus),
  amount: MoneySchema,
  transactionId: z.string().optional(),
  stripePaymentIntentId: z.string().optional(),
  metadata: MetadataSchema.optional(),
});

export const FulfillmentInfoSchema = z.object({
  type: z.nativeEnum(FulfillmentType),
  address: AddressSchema.optional(),
  scheduledFor: TimestampSchema.optional(),
  trackingNumber: z.string().optional(),
  carrier: z.string().optional(),
  notes: z.string().optional(),
});

export const OrderNoteSchema = z.object({
  id: IdSchema,
  targetId: IdSchema,
  target: z.enum(['store', 'buyer', 'notification']),
  note: z.string().min(1),
  createdAt: TimestampSchema,
});

export const OrderSchema = z.object({
  id: IdSchema,
  storeId: IdSchema,
  userId: IdSchema,
  referenceId: z.string().min(1),
  status: z.nativeEnum(OrderStatus),
  items: z.array(OrderItemSchema).min(1),
  subtotal: MoneySchema,
  tax: MoneySchema.optional(),
  discount: MoneySchema.optional(),
  deliveryFee: MoneySchema.optional(),
  total: MoneySchema,
  payment: PaymentInfoSchema,
  fulfillment: FulfillmentInfoSchema,
  notes: z.array(OrderNoteSchema),
  metadata: MetadataSchema,
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
});

export const SubscriptionSchema = z.object({
  id: IdSchema,
  storeId: IdSchema,
  name: z.string().min(1),
  description: z.string().optional(),
  price: MoneySchema,
  cadence: z.nativeEnum(SubscriptionCadence),
  status: z.nativeEnum(SubscriptionPlanStatus),
  images: z.array(ImageSchema),
  productIds: z.array(IdSchema),
  maxSubscribers: z.number().int().positive().optional(),
  currentSubscribers: z.number().int().nonnegative(),
  trialPeriodDays: z.number().int().nonnegative(),
  startDate: TimestampSchema.optional(),
  endDate: TimestampSchema.optional(),
  metadata: MetadataSchema,
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
});

export const CustomerSubscriptionSchema = z.object({
  id: IdSchema,
  userId: IdSchema,
  subscriptionId: IdSchema,
  status: z.nativeEnum(SubscriptionStatus),
  startDate: TimestampSchema,
  currentPeriodStart: TimestampSchema,
  currentPeriodEnd: TimestampSchema,
  nextBillingDate: TimestampSchema.optional(),
  endDate: TimestampSchema.optional(),
  pausedAt: TimestampSchema.optional(),
  cancelledAt: TimestampSchema.optional(),
  metadata: MetadataSchema,
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
});

export const UserAccountSchema = z.object({
  id: IdSchema,
  email: EmailSchema,
  fullName: z.string().min(1),
  defaultLocale: z.string().min(2),
  accountTier: z.nativeEnum(AccountTier),
  accountStatus: z.nativeEnum(AccountStatus),
  role: z.nativeEnum(UserRole),
  stripeCustomerId: z.string().nullable(),
  marketingConsent: z.boolean(),
  agreementAccepted: z.boolean(),
  verificationStatus: z.nativeEnum(VerificationStatus),
  preferences: z.object({
    emailNotifications: z.boolean(),
    smsNotifications: z.boolean(),
    marketingEmails: z.boolean(),
  }),
  metadata: MetadataSchema,
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
});

export const VendorProfileSchema = z.object({
  id: IdSchema,
  userId: IdSchema,
  businessName: z.string().min(1),
  phone: PhoneSchema.optional(),
  phoneCountryCode: z.string().optional(),
  addresses: z.array(TypedAddressSchema),
  verificationStatus: z.nativeEnum(VerificationStatus),
  stripeConnectId: z.string().optional(),
  agreementAccepted: z.boolean(),
  onboardingCompleted: z.boolean(),
  metadata: MetadataSchema,
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
});

export const CategorySchema = z.object({
  id: IdSchema,
  storeId: IdSchema,
  name: z.string().min(1),
  slug: SlugSchema,
  description: z.string().optional(),
  type: z.nativeEnum(CategoryType),
  parentId: IdSchema.optional(),
  image: ImageSchema.optional(),
  displayOrder: z.number().int().nonnegative(),
  isActive: z.boolean(),
  metadata: MetadataSchema,
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
});

export const InviteSchema = z.object({
  id: IdSchema,
  inviterId: IdSchema,
  email: EmailSchema,
  role: z.nativeEnum(UserRole),
  storeId: IdSchema.optional(),
  storeAccessLevel: z.nativeEnum(StoreAccessLevel).optional(),
  status: z.enum(['pending', 'accepted', 'rejected', 'expired']),
  token: z.string().min(1),
  expiresAt: TimestampSchema,
  acceptedAt: TimestampSchema.optional(),
  metadata: MetadataSchema,
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
});

export const LinkSchema = z.object({
  id: IdSchema,
  sourceId: IdSchema,
  targetId: IdSchema,
  type: z.enum([
    'customer',
    'follower',
    'contact',
    'staff',
    'donor',
    'friend',
    'student',
    'co-guardian',
    'parent',
    'organization',
  ]),
  status: z.enum(['expired', 'unverified', 'verified', 'active', 'rejected']),
  metadata: MetadataSchema,
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
});

export const LogSchema = z.object({
  id: IdSchema,
  level: z.enum(['info', 'warn', 'error', 'debug']),
  action: z.string().min(1),
  entityType: z.string().min(1),
  entityId: IdSchema,
  userId: IdSchema.optional(),
  message: z.string().min(1),
  metadata: MetadataSchema,
  createdAt: TimestampSchema,
});

export const SupplierSchema = z.object({
  id: IdSchema,
  storeId: IdSchema,
  name: z.string().min(1),
  contactName: z.string().optional(),
  email: EmailSchema.optional(),
  phone: PhoneSchema.optional(),
  phoneCountryCode: z.string().optional(),
  addresses: z.array(TypedAddressSchema),
  isActive: z.boolean(),
  metadata: MetadataSchema,
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
});
