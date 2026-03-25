import type { z } from 'zod';

export function validateSchema<TSchema extends z.ZodTypeAny>(
  schema: TSchema,
  input: unknown
): z.infer<TSchema> {
  return schema.parse(input);
}

export function safeValidateSchema<TSchema extends z.ZodTypeAny>(
  schema: TSchema,
  input: unknown
): z.ZodSafeParseResult<z.output<TSchema>> {
  return schema.safeParse(input) as z.ZodSafeParseResult<z.output<TSchema>>;
}
