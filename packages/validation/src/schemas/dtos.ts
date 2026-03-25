import {
  FulfillmentType,
  PaymentMethod,
  ProductAvailability,
  StoreType,
  SubscriptionCadence,
} from '@ecomsaas/domain';
import { z } from 'zod';
import {
  AddressSchema,
  ImageUploadSchema,
  MoneyInputSchema,
  OperatingHoursSchema,
} from './value-objects';
import { EmailSchema, MetadataSchema, PhoneSchema, SlugSchema, TimestampSchema } from './common';

export const CreateStoreRequestSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  email: EmailSchema.optional(),
  phoneNumber: PhoneSchema.optional(),
  phoneCountryCode: z.string().optional(),
  address: AddressSchema,
  slug: SlugSchema,
  storeType: z.nativeEnum(StoreType),
  operatingHours: z.array(OperatingHoursSchema).optional(),
  metadata: MetadataSchema.optional(),
});

export const CreateProductRequestSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: MoneyInputSchema,
  compareAtPrice: MoneyInputSchema.optional(),
  images: z.array(ImageUploadSchema).optional(),
  categoryId: z.string().min(1).optional(),
  supplierId: z.string().min(1).optional(),
  availability: z.nativeEnum(ProductAvailability).optional(),
  inventory: z
    .object({
      trackQuantity: z.boolean(),
      quantity: z.number().int().nonnegative().optional(),
      lowStockThreshold: z.number().int().nonnegative().optional(),
    })
    .optional(),
  variants: z
    .array(
      z.object({
        name: z.string().min(1),
        sku: z.string().optional(),
        price: MoneyInputSchema.optional(),
        attributes: z.record(z.string(), z.string()),
      })
    )
    .optional(),
  tags: z.array(z.string()).optional(),
  metadata: MetadataSchema.optional(),
});

export const CreateOrderRequestSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        variantId: z.string().optional(),
        quantity: z.number().int().positive(),
      })
    )
    .min(1),
  payment: z.object({
    method: z.nativeEnum(PaymentMethod),
  }),
  fulfillment: z.object({
    type: z.nativeEnum(FulfillmentType),
    address: AddressSchema.optional(),
    scheduledFor: TimestampSchema.optional(),
    notes: z.string().optional(),
  }),
  notes: z.string().optional(),
  metadata: MetadataSchema.optional(),
});

export const CreateSubscriptionRequestSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: MoneyInputSchema,
  cadence: z.nativeEnum(SubscriptionCadence),
  productIds: z.array(z.string().min(1)).min(1),
  images: z.array(ImageUploadSchema).optional(),
  maxSubscribers: z.number().int().positive().optional(),
  startDate: TimestampSchema.optional(),
  endDate: TimestampSchema.optional(),
  metadata: MetadataSchema.optional(),
});
