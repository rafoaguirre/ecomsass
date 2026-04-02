import { BadRequestException, type PipeTransform } from '@nestjs/common';
import { safeValidateSchema } from '@ecomsaas/validation/helpers';

type Schema = Parameters<typeof safeValidateSchema>[0];

export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: Schema) {}

  transform(value: unknown) {
    const result = safeValidateSchema(this.schema, value);

    if (!result.success) {
      throw new BadRequestException(result.error.flatten().fieldErrors);
    }

    return result.data;
  }
}
