# Copilot Instructions — @ecomsaas/contracts

## Package Role

This package lives in the **interface-adapter layer** of Clean Architecture. It defines shapes that cross architectural boundaries — API request/response contracts, pagination, error formats, and other protocol types.

## Dependency Rule

```
@ecomsaas/contracts → @ecomsaas/domain (inward only)
```

- This package **depends on** `@ecomsaas/domain` (entities, enums, value objects).
- This package must NEVER import from application, infrastructure, or presentation layers.
- Domain has **zero knowledge** of this package.

## What Belongs Here

- **DTOs** (`src/dtos/`): Request and response shapes for API endpoints, organized by domain area (auth/, stores/, products/, orders/, subscriptions/).
- **Common** (`src/common/`): Cross-cutting protocol concerns:
  - `ApiResponse.ts` — Generic success/error response wrappers
  - `Pagination.ts` — Cursor and offset pagination types
  - `ErrorTypes.ts` — ErrorCode enum, validation error details
  - `FilterOptions.ts` — Sort, date range, filter types

## What Does NOT Belong Here

- Domain entities, value objects, enums → `@ecomsaas/domain`
- Business logic or validation rules → `@ecomsaas/application` or `@ecomsaas/validation`
- Framework-specific decorators (NestJS, class-validator) → backend infrastructure
- UI components or React-specific types → `@ecomsaas/ui`

## Conventions

- DTOs are plain interfaces (no classes, no decorators).
- Request DTOs: `Create<Entity>Request`, `Update<Entity>Request`
- Response DTOs: `<Entity>Response`, `<Entity>Summary` (for list views)
- Import domain types via package path: `import type { Store } from '@ecomsaas/domain/entities';`
- Import enums via: `import { OrderStatus } from '@ecomsaas/domain/enums';`
- Never use relative paths to reach into domain's source — always use `@ecomsaas/domain/*` subpath exports.
- Use `type` imports for all interfaces: `import type { ... }`.
- One DTO file per domain area barrel-exported via `index.ts`.

## Cross-Package Resolution

The `tsconfig.json` in this package has `paths` mapping:

```json
{
  "@ecomsaas/domain": ["../domain/dist/index.d.ts"],
  "@ecomsaas/domain/*": ["../domain/dist/*.d.ts"]
}
```

This means **domain must be built first** before contracts can type-check. If you see "cannot find module @ecomsaas/domain" errors, run `pnpm build` in the domain package first.

## Subpath Exports

```typescript
import type { CreateStoreRequest, StoreResponse } from '@ecomsaas/contracts/dtos';
import type { ApiResponse, OffsetPaginatedResponse } from '@ecomsaas/contracts/common';
import { ErrorCode, createSuccessResponse } from '@ecomsaas/contracts/common';
```

## Build

```bash
pnpm build       # tsup → dist/
pnpm type-check  # tsc --noEmit (requires domain to be built)
```
