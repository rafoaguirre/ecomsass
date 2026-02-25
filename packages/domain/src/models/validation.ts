import { ValidationError } from '../errors';

/** Kebab-case slug: lowercase alphanumeric segments separated by hyphens. */
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Basic email format check. */
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ---------------------------------------------------------------------------
// Shared validators
// ---------------------------------------------------------------------------

export function validateRequired(value: string, fieldName: string): void {
  if (!value || value.trim().length === 0) {
    throw new ValidationError(`${fieldName} is required`, { field: fieldName });
  }
}

export function validateMinLength(value: string, min: number, fieldName: string): void {
  if (!value || value.length < min) {
    throw new ValidationError(`${fieldName} must be at least ${String(min)} characters`, {
      field: fieldName,
      constraint: 'minLength',
      min,
    });
  }
}

export function validateMaxLength(value: string, max: number, fieldName: string): void {
  if (value.length > max) {
    throw new ValidationError(`${fieldName} must not exceed ${String(max)} characters`, {
      field: fieldName,
      constraint: 'maxLength',
      max,
    });
  }
}

export function validateSlug(slug: string, entityName: string): void {
  if (!slug || slug.trim().length === 0) {
    throw new ValidationError(`${entityName} slug is required`, { field: 'slug' });
  }
  if (!SLUG_PATTERN.test(slug)) {
    throw new ValidationError(`${entityName} slug must be kebab-case (lowercase, hyphens only)`, {
      field: 'slug',
      pattern: 'kebab-case',
    });
  }
}

export function validateEmail(email: string, fieldName: string = 'email'): void {
  if (!EMAIL_PATTERN.test(email)) {
    throw new ValidationError(`${fieldName} is not a valid email address`, { field: fieldName });
  }
}

export function validateNonNegative(value: number, fieldName: string): void {
  if (value < 0) {
    throw new ValidationError(`${fieldName} must not be negative`, {
      field: fieldName,
      constraint: 'nonNegative',
    });
  }
}
