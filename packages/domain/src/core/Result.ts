/**
 * Result type for handling success/failure without throwing exceptions.
 *
 * Use `ok(value)` and `err(error)` helpers to construct Results.
 * Currently available for future migration — models still throw
 * for backward compatibility during Phase 0.2.
 */
export type Result<T, E extends Error = Error> = Ok<T> | Err<E>;

export class Ok<T> {
  readonly ok = true as const;
  readonly err = false as const;

  constructor(public readonly value: T) {}

  isOk(): this is Ok<T> {
    return true;
  }

  isErr(): this is never {
    return false;
  }

  unwrap(): T {
    return this.value;
  }

  unwrapOr(_defaultValue: T): T {
    return this.value;
  }

  map<U>(fn: (value: T) => U): Result<U, never> {
    return new Ok(fn(this.value));
  }

  mapErr<F extends Error>(_fn: (error: never) => F): Result<T, F> {
    return this as unknown as Result<T, F>;
  }

  andThen<U, F extends Error>(fn: (value: T) => Result<U, F>): Result<U, F> {
    return fn(this.value);
  }
}

export class Err<E extends Error> {
  readonly ok = false as const;
  readonly err = true as const;

  constructor(public readonly error: E) {}

  isOk(): this is never {
    return false;
  }

  isErr(): this is Err<E> {
    return true;
  }

  unwrap(): never {
    throw this.error;
  }

  unwrapOr<T>(defaultValue: T): T {
    return defaultValue;
  }

  map<U>(_fn: (value: never) => U): Result<U, E> {
    return this as unknown as Result<U, E>;
  }

  mapErr<F extends Error>(fn: (error: E) => F): Result<never, F> {
    return new Err(fn(this.error));
  }

  andThen<U, F extends Error>(_fn: (value: never) => Result<U, F>): Result<U, E | F> {
    return this as unknown as Result<U, E | F>;
  }
}

/**
 * Helper functions for creating Results.
 */
export const ok = <T>(value: T): Ok<T> => new Ok(value);
export const err = <E extends Error>(error: E): Err<E> => new Err(error);
