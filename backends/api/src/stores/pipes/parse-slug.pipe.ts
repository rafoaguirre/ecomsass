import { BadRequestException, Injectable, type PipeTransform } from '@nestjs/common';
import { safeValidateSchema } from '@ecomsaas/validation/helpers';
import { SlugSchema } from '@ecomsaas/validation/schemas';

@Injectable()
export class ParseSlugPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    const parsed = safeValidateSchema(SlugSchema, value);

    if (!parsed.success) {
      throw new BadRequestException('Invalid store slug format');
    }

    return parsed.data;
  }
}
