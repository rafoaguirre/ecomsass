import { z } from 'zod';

export const IdSchema = z.string().min(1);
export const SlugSchema = z
  .string()
  .min(1)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

export const TimestampSchema = z.coerce.date();
export const MetadataSchema = z.record(z.string(), z.unknown());

export const EmailSchema = z.string().email();
export const PhoneSchema = z.string().min(5).max(30);

export const IsoDateTimeStringSchema = z.string().datetime();

export const NonEmptyStringArraySchema = z.array(z.string().min(1));
