import { DayOfWeek, AddressType } from '@ecomsaas/domain';
import { z } from 'zod';

export const CurrencyCodeSchema = z.enum([
  'CAD',
  'USD',
  'EUR',
  'GBP',
  'BTC',
  'USDC',
  'MATIC',
  'POL',
]);

export const MoneySchema = z.object({
  amount: z.bigint(),
  currency: CurrencyCodeSchema,
});

export const MoneyInputSchema = z.object({
  amount: z.number().int().nonnegative(),
  currency: CurrencyCodeSchema,
});

export const AddressSchema = z.object({
  street: z.string().min(1),
  street2: z.string().min(1).optional(),
  city: z.string().min(1),
  province: z.string().min(1),
  country: z.string().min(1),
  postalCode: z.string().min(1),
});

export const TypedAddressSchema = z.object({
  type: z.nativeEnum(AddressType),
  address: AddressSchema,
});

export const ImageSchema = z.object({
  src: z.string().url(),
  name: z.string().optional(),
  alt: z.string().optional(),
  directory: z.string().min(1),
  type: z.string().min(1),
  main: z.boolean(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const ImageUploadSchema = z
  .object({
    file: z.unknown().optional(),
    url: z.string().url().optional(),
    name: z.string().optional(),
    alt: z.string().optional(),
    main: z.boolean().optional(),
  })
  .refine((value) => value.file !== undefined || value.url !== undefined, {
    message: 'Either file or url is required',
  });

export const TimeSlotSchema = z.object({
  hour: z.number().int().min(0).max(23),
  minutes: z.number().int().min(0).max(59),
});

export const ScheduleSchema = z.object({
  days: z.array(z.nativeEnum(DayOfWeek)).min(1),
  hours: z
    .array(
      z.object({
        from: TimeSlotSchema,
        to: TimeSlotSchema,
      })
    )
    .min(1),
  active: z.boolean(),
  notes: z.string().optional(),
  limit: z
    .object({
      type: z.enum(['half-an-hour', 'hour', 'day']),
      amount: z.number().positive(),
      active: z.boolean(),
    })
    .optional(),
});

export const OperatingHoursSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  openTime: z.string().regex(/^\d{2}:\d{2}$/),
  closeTime: z.string().regex(/^\d{2}:\d{2}$/),
  isClosed: z.boolean(),
});
