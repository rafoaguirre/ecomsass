# Copilot Instructions — @ecomsaas/domain

## Package Role

This is the **innermost ring** of Clean Architecture — the stable core that everything else depends on and that depends on nothing.

## Hard Rules

1. **Zero dependencies.** This package must NEVER add entries to `dependencies` in package.json. Only `devDependencies` (tsup, typescript, vitest) are allowed.
2. **No imports from other @ecomsaas packages.** Domain does not know about contracts, application, or infrastructure.
3. **No framework-specific code.** Nothing from NestJS, React, Supabase, Express, etc.
4. **No side effects.** No I/O, no network calls, no database access, no logging.

## What Belongs Here

- **Core** (`src/core/`): Base DDD building blocks — `Entity`, `AggregateRoot`, `ValueObject`, `Result<T,E>`, `DomainEvent`. All domain models extend these.
- **Entities** (`src/entities/`): Interfaces representing core business objects — UserAccount, VendorProfile, Store, Product, Order, Subscription, etc.
- **Value Objects** (`src/value-objects/`): Small immutable types — Money, Address, GeoPoint, Image, Schedule, Quantity. (Interfaces today; will become classes extending `ValueObject<T>` when needed.)
- **Enums** (`src/enums/`): Business enumerations — OrderStatus, PaymentMethod, AccountTier, StoreType, etc.
- **Errors** (`src/errors/`): Typed domain error hierarchy — `DomainError` base, `ValidationError`, `InvariantError`, `NotFoundError`, etc. Never throw raw `Error` in domain code.
- **Models** (`src/models/`): Rich domain model classes wrapping entity interfaces with business logic, validation, and immutable updates. Each model extends `AggregateRoot<T>`.

## What Does NOT Belong Here

- DTOs, request/response shapes → `@ecomsaas/contracts`
- API response wrappers, pagination, error codes → `@ecomsaas/contracts`
- Validation logic (Zod schemas) → `@ecomsaas/validation` (planned)
- Repository interfaces → `@ecomsaas/application` (planned)
- Database models, ORM entities → backend infrastructure layer

## The Litmus Test

> Would this concept exist even if we had no API, no database, and no UI?

If **yes** → it belongs here.  
If **no** → it belongs in an outer layer.

## Domain Model Conventions

### Extending AggregateRoot

All domain models extend `AggregateRoot<T>` where `T` is the corresponding entity interface:

```typescript
export class StoreModel extends AggregateRoot<Store> implements Store {
  get name(): string {
    return this.props.name;
  }
  // ... getters delegate to this.props
}
```

- Private constructor — all creation goes through `static create()` (with defaults) or `static fromData()` (reconstitution from persistence).
- Property access via getters delegating to `this.props`.
- `toData(): T` returns `{ ...this.props }` for serialization.

### Immutable Updates

All mutations return a new instance. Use a private `withUpdates()` helper to avoid repeating `new XModel({ ...this.props, ...updates, updatedAt: new Date() })`:

```typescript
private withUpdates(updates: Partial<Store>): StoreModel {
  return new StoreModel({ ...this.props, ...updates, updatedAt: new Date() });
}

updateName(name: string): StoreModel {
  return this.withUpdates({ name });
}
```

### Validation

- Validation runs in the constructor — every instance is guaranteed valid.
- Use shared validators from `models/validation.ts` (e.g. `validateRequired`, `validateSlug`, `validateEmail`, `validateNonNegative`).
- Throw `ValidationError` for input/field validation failures.
- Throw `InvariantError` for business rule violations in mutation methods.
- Never throw raw `new Error()`.

### Error Types

| Error Class       | When to use                                                            |
| ----------------- | ---------------------------------------------------------------------- |
| `ValidationError` | Bad input: empty name, invalid slug format, negative price             |
| `InvariantError`  | Business rule violation: out-of-stock adjustment, duplicate variant ID |
| `NotFoundError`   | Entity/resource not found                                              |

## General Conventions

- One interface per file, PascalCase filenames (e.g. `UserAccount.ts`).
- All directories have barrel `index.ts` files re-exporting everything.
- Use `type` keyword for imports: `import type { Money } from '../value-objects';`
- Enums are runtime values (not `const enum`), exported from `src/enums/index.ts`.
- Value object interfaces are prefixed with relevant context, not `I` prefix (e.g. `Money`, not `IMoney`).
- The `Money` value object uses `amountInCents: number` — never floating point for currency.

## Subpath Exports

```typescript
import type { Store } from '@ecomsaas/domain/entities';
import type { Money } from '@ecomsaas/domain/value-objects';
import { OrderStatus } from '@ecomsaas/domain/enums';
import { AggregateRoot, Entity } from '@ecomsaas/domain/core';
import { ValidationError } from '@ecomsaas/domain/errors';
import { StoreModel } from '@ecomsaas/domain/models';
```

## Build & Test

```bash
pnpm build       # tsup → dist/
pnpm type-check  # tsc --noEmit
pnpm test        # vitest run
pnpm lint        # eslint src/
```

This package MUST build before `@ecomsaas/contracts` (contracts resolves types from `domain/dist/`).
