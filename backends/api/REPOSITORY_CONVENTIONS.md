# Repository Conventions

This document describes the repository pattern conventions used across the API backend.

## Architecture

```
Application Layer (ports)      API Layer (adapters)
─────────────────────────      ───────────────────────────────────
StoreRepository (interface) ←── SupabaseStoreRepository (concrete)
ProductRepository           ←── SupabaseProductRepository
UserRepository              ←── SupabaseUserRepository
VendorProfileRepository     ←── SupabaseVendorProfileRepository
OrderRepository             ←── (future)
```

- **Ports** live in `packages/application/src/ports/` and define persistence contracts.
- **Adapters** live in `backends/api/src/<module>/repositories/` and implement the ports using Supabase.
- Application use cases depend on port interfaces, never on concrete adapters.

## Return Type Conventions

| Operation            | Return Type                    | Rationale                                   |
| -------------------- | ------------------------------ | ------------------------------------------- |
| Find by ID/slug      | `Result<Model, NotFoundError>` | "Not found" is an expected business outcome |
| List/query           | `Model[]`                      | Empty array is the natural zero-value       |
| Save (create/update) | `Result<Model, Error>`         | Persistence failures are recoverable        |
| Delete               | `Result<void, Error>`          | Persistence failures are recoverable        |
| Existence check      | `boolean`                      | Simple predicate                            |

**Infrastructure errors** (Supabase down, network issues) are thrown as plain `Error` instances. These propagate to the `GlobalExceptionFilter`, which returns HTTP 500.

**Business errors** (not found, validation) are returned as `Result` values. The service or controller layer decides how to handle them.

## Naming Conventions

| Item             | Convention                         | Example                   |
| ---------------- | ---------------------------------- | ------------------------- |
| Port interface   | `<Entity>Repository`               | `StoreRepository`         |
| Concrete adapter | `Supabase<Entity>Repository`       | `SupabaseStoreRepository` |
| Injection token  | `<ENTITY>_REPOSITORY` (Symbol)     | `STORE_REPOSITORY`        |
| Row type         | `<Entity>Row` (private to adapter) | `StoreRow`                |
| Mapper method    | `private to<Entity>Model(row)`     | `toStoreModel(row)`       |

## Pagination

Use the shared helpers from `src/common/database/`:

```typescript
import { applyPagination, type PaginationOptions } from '../../common/database';

async findByStoreId(storeId: string, options?: PaginationOptions): Promise<Model[]> {
  let query = this.supabase.from('products').select('*').eq('store_id', storeId);

  if (options) {
    ({ query } = applyPagination(query, options));
  }

  const { data, error } = await query.returns<ProductRow[]>();
  // ...
}
```

- Default page size: 20
- Maximum page size: 100
- Offset-based (matches Supabase `.range()`)

## Module Wiring

Each module registers its repository adapter and wires use cases via factory providers:

```typescript
@Module({
  providers: [
    SupabaseStoreRepository,
    {
      provide: STORE_REPOSITORY,
      useExisting: SupabaseStoreRepository,
    },
    {
      provide: GetStore,
      useFactory: (repo: SupabaseStoreRepository) => new GetStore(repo),
      inject: [SupabaseStoreRepository],
    },
  ],
})
export class StoresModule {}
```

## Error Mapping

The `GlobalExceptionFilter` automatically maps `DomainError` subclasses to HTTP statuses:

| Domain Error         | HTTP Status              |
| -------------------- | ------------------------ |
| `ValidationError`    | 400 Bad Request          |
| `NotFoundError`      | 404 Not Found            |
| `PermissionError`    | 403 Forbidden            |
| `InvariantError`     | 422 Unprocessable Entity |
| `ConcurrencyError`   | 409 Conflict             |
| `QuotaExceededError` | 429 Too Many Requests    |

Services should **not** catch domain errors and re-throw HTTP exceptions. Let them propagate to the filter.

## Row Mapping

Each repository has a private `to<Entity>Model(row)` method that converts a Supabase row to a domain model:

- Use `<Entity>Model.fromData()` for reconstitution
- Convert `null` → `undefined` for optional domain fields
- Use helper functions for JSONB parsing (`asRecord`, `asOperatingHours`, etc.)
- Cast enum strings to domain enum types via `as`
- Parse `created_at`/`updated_at` timestamps with `new Date()`
