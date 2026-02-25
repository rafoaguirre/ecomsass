/**
 * Base class for all domain errors.
 *
 * Provides a machine-readable `code` and optional structured `details`
 * so that outer layers can handle errors without string-matching.
 */
export abstract class DomainError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

/**
 * Input/field validation failures.
 */
export class ValidationError extends DomainError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', details);
  }
}

/**
 * Business logic invariant violations.
 */
export class InvariantError extends DomainError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'INVARIANT_ERROR', details);
  }
}

/**
 * Resource not found errors.
 */
export class NotFoundError extends DomainError {
  constructor(resource: string, identifier: string) {
    super(`${resource} with identifier '${identifier}' not found`, 'NOT_FOUND', {
      resource,
      identifier,
    });
  }
}

/**
 * Permission/authorization errors.
 */
export class PermissionError extends DomainError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'PERMISSION_ERROR', details);
  }
}

/**
 * Concurrency/optimistic locking errors.
 */
export class ConcurrencyError extends DomainError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'CONCURRENCY_ERROR', details);
  }
}

/**
 * Quota/limit exceeded errors.
 */
export class QuotaExceededError extends DomainError {
  constructor(
    public readonly resource: string,
    public readonly limit: number,
    public readonly current: number
  ) {
    super(`Quota exceeded for ${resource}: ${String(current)}/${String(limit)}`, 'QUOTA_EXCEEDED', {
      resource,
      limit,
      current,
    });
  }
}
