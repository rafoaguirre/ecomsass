# Copilot Instructions — @ecomsaas/domain

## Package Role

This is the **innermost ring** of Clean Architecture — the stable core that everything else depends on and that depends on nothing.

## Hard Rules

1. **Zero dependencies.** This package must NEVER add entries to `dependencies` in package.json. Only `devDependencies` (tsup, typescript) are allowed.
2. **No imports from other @ecomsaas packages.** Domain does not know about contracts, application, or infrastructure.
3. **No classes, no decorators, no runtime code (yet).** Phase 0.1 is interfaces + enums only. Rich domain models (classes with business logic) come in Phase 0.2.
4. **No framework-specific code.** Nothing from NestJS, React, Supabase, Express, etc.
5. **No side effects.** No I/O, no network calls, no database access, no logging.

## What Belongs Here

- **Entities** (`src/entities/`): Interfaces representing core business objects — UserAccount, VendorProfile, Store, Product, Order, Subscription, etc.
- **Value Objects** (`src/value-objects/`): Small immutable types — Money, Address, GeoPoint, Image, Schedule, Quantity.
- **Enums** (`src/enums/`): Business enumerations — OrderStatus, PaymentMethod, AccountTier, StoreType, etc.

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

## Conventions

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
```

## Build

```bash
pnpm build    # tsup → dist/
pnpm type-check  # tsc --noEmit
```

This package MUST build before `@ecomsaas/contracts` (contracts resolves types from `domain/dist/`).
