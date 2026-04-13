import { BadRequestException, type PipeTransform } from '@nestjs/common';

/**
 * Validates optional string query parameters against an enum.
 * Returns undefined for missing/empty values, throws 400 for invalid ones.
 */
export class ParseOptionalEnumPipe<T extends Record<string, string>> implements PipeTransform<
  string | undefined,
  T[keyof T] | undefined
> {
  private readonly allowed: Set<string>;

  constructor(
    private readonly enumType: T,
    private readonly paramName: string
  ) {
    this.allowed = new Set(Object.values(enumType));
  }

  transform(value: string | undefined): T[keyof T] | undefined {
    if (value === undefined || value === '') return undefined;
    if (!this.allowed.has(value)) {
      const valid = [...this.allowed].join(', ');
      throw new BadRequestException(
        `Invalid value "${value}" for parameter "${this.paramName}". Allowed: ${valid}`
      );
    }
    return value as T[keyof T];
  }
}
