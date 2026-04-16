# Technical Decisions Summary

> Quick reference for key architectural and implementation decisions made for the EcomSaaS project.

## Core Technology Decisions

### Message Queue: **BullMQ**

- ✅ Priority-based queuing
- ✅ Cloud-agnostic (works on GCP, AWS, any Redis)
- ✅ Easy to dockerize
- Architecture: API enqueues jobs → Worker processes them
- **Implemented:** `BullMQQueue` adapter in `packages/infrastructure/queue` with single-worker dispatch map, retry/backoff
- **Admin:** Bull Board dashboard at `/admin/queues` (HTTP Basic Auth in production)
- **Fallback:** Graceful degradation to `InMemoryQueue` when Redis is not configured

### Email: **Resend**

- Clean REST API with batch support
- `EmailSender` port in application layer, adapters in infrastructure
- **Implemented:** `ResendEmailSender` (production) + `ConsoleEmailSender` (dev fallback)
- **Templates:** Order confirmation, status update — pure functions with HTML escaping
- **Async:** Email jobs enqueued via BullMQ, processed with idempotency keys
- **Fallback:** Console sender when `RESEND_API_KEY` is not configured

### Background Worker: **Standalone Node.js + croner**

- Lightweight standalone process (no NestJS overhead) in `backends/worker/`
- Connects to the same Redis/BullMQ queue as the API
- **Cron scheduler:** croner library drives periodic job enqueuing
- **Schedules:** Payment reconciliation (hourly), low-stock alerts (daily @ 06:00 UTC), stale order cleanup (daily @ 03:00 UTC)
- **Processors:** Stub implementations — real business logic plugs in as domain services become available
- **Shutdown:** Graceful SIGTERM/SIGINT handling — stops crons, drains worker, closes queue
- **Docker:** Dedicated Compose service with Redis health dependency

### Payment Processing: **Stripe Connect**

- Handles multi-vendor payment splitting
- Platform fee management
- Stripe bears custodianship burden

### Subdomain Routing: **Next.js Middleware (Primary)**

- **Pros**: No external dependency, easy local dev, full control
- **Alternative**: Cloudflare Workers (evaluate if performance demands)
- Implementation: Middleware extracts subdomain → rewrites to `/store/[slug]`

### MCP Server: **AI Chat Interface**

- Vendors query API data via natural language
- Set subscriptions, schedules, configurations easily
- Connects to API internally

### File Storage

**Production**: Supabase Storage / GCP Cloud Storage / AWS S3
**Local Development**: **MinIO** (S3-compatible Docker container)

- Perfect for local S3/GCS simulation
- Included in docker-compose.yml

### Real-Time Features: **Supabase Realtime**

- Order status updates
- Inventory sync
- Live notifications
- No separate real-time service needed
- Efficient WebSocket-based subscriptions

### Database Migrations: **Supabase CLI (Wrapped)**

- Wrapper in `packages/infrastructure/database`
- Abstraction allows future tool changes
- Environment-aware (dev, staging, production)

### Supabase Client vs SQL Database Interface

- **`Database` interface** (`packages/infrastructure/database/Database.ts`): Raw SQL
  abstraction (`query`, `execute`, `beginTransaction`). Used for complex queries,
  migrations, or cases where PostgREST is insufficient.
- **`createSupabaseClient`** (`packages/infrastructure/database/SupabaseClient.ts`):
  Factory for `@supabase/supabase-js` client. Used in repository implementations
  for standard CRUD via PostgREST (`client.from('table').select()`).
- **Decision**: Repository implementations use the Supabase JS client directly through
  NestJS DI (`SUPABASE_CLIENT` token). They do NOT implement the SQL `Database`
  interface. The two coexist for different use cases.
- **Rationale**: The Supabase JS client is PostgREST-based, not raw SQL. Forcing it
  into the SQL interface would create a leaky abstraction. Repositories speaking the
  Supabase query builder API is more natural and type-safe.

### Clean Architecture & Database

- **Domain Layer**: Pure entities (no DB specifics)
- **Application Layer**: Use cases with repository interfaces
- **Infrastructure Layer**: DB adapters per app
  - API: Direct Supabase access
  - Frontend: HTTP calls to API
  - Each implements repository interfaces

### Caching: **Redis**

- Product catalogues
- Frequently accessed endpoints
- **Implemented:** `RedisCache` adapter in `packages/infrastructure/cache` (ioredis, key namespacing, TTL, mget/mset)
- **Fallback:** Graceful degradation to `InMemoryCache` when Redis is not configured

### ID Generation Boundary

- **Current:** `PlaceOrder` consumes an `IdGenerator` application port
- **Implementation:** Infrastructure provides `packages/infrastructure/id-generator` adapter
- **Architecture rule:** Application use cases consume ID generation through a port
  to keep responsibilities separated (SRP/Clean Architecture)

### Environment Management

- **Principle**: Code identical across environments
- **What changes**: Only secrets/configuration
- **Local**: .env files
- **Cloud**: Infisical (primary), with provider abstraction in infrastructure
- **Runtime pattern**: preload required secrets at startup, cache in-process, inject typed config
- **Policy**: avoid blind global export of all secrets to `process.env`; attach only explicit keys when needed
- **CI enforcement**: Gitleaks secret scanning in `.github/workflows/ci.yml` with tuned allowlist in `.gitleaks.toml`

### API JWT Validation Strategy (Supabase)

- **Current**: Local JWT verification using `jose` library with Supabase JWKS.
  Eliminates per-request network round-trip to Supabase Auth.
- **Guard**: `SupabaseAuthGuard` extracts role from `app_metadata.role` in JWT payload.
- **Future improvements**:
  - Gateway/edge-level JWT validation for centralized auth enforcement.
  - Request-scoped auth context propagation to support strict RLS flows relying on `auth.uid()`.

### API Architecture: **Modular Monolith (NestJS)**

- Single deployable app
- Feature modules (Auth, Stores, Products, Orders)
- Clear module boundaries
- Easy extraction to microservices later
- **API Style**: REST (no GraphQL for now)
- **Versioning**: Not needed initially (add when API stabilizes)

### Backend Worker Architecture

- Worker: Lightweight job submitter
- API: Processes jobs with registered handlers
- Shared queue configuration in packages
- Alternative: API could handle both producing & consuming

### Testing Strategy

- Understood as part of every phase
- Unit tests: Domain & application layers
- Integration tests: API endpoints
- E2E tests: Critical flows

## Deferred Decisions

### SEO Optimization

- Basic meta tags in initial implementation
- Advanced SEO (Open Graph, structured data, sitemaps) → Later phase

### Blockchain Implementation Details

- Wallet connection UX
- Gas fee handling
- Testnet vs mainnet deployment
- → Detailed design when Phase 9 begins

### API Versioning

- Not needed until API stabilizes and "launches"
- Will add `/api/v1/`, `/api/v2/` pattern when necessary

## Local Development Setup

### Docker Compose Services

```yaml
services:
  - api (NestJS)
  - vendor (Next.js)
  - marketplace (Next.js)
  - redis (caching + queue)
  - minio (S3-compatible storage)
  # postgres (optional - using Supabase cloud)
```

### Ports

- API: `localhost:3000`
- Vendor App: `localhost:3001`
- Marketplace: `localhost:3002`
- Redis: `localhost:6379`
- MinIO API: `localhost:9000`
- MinIO Console: `localhost:9001`

## Shared Packages Structure

```
packages/
├── domain/              # Core entities, value objects, enums (zero deps)
├── contracts/           # DTOs, API protocol types (depends on domain)
├── application/         # Use cases and port interfaces
├── api-client/          # Shared HTTP client factory (createApiClient)
├── ui/                  # React components (shadcn + Tailwind)
├── utils/               # Pure utilities (planned)
├── config/              # Configurations (planned)
├── validation/          # Zod schemas
└── infrastructure/      # Infra utilities
    ├── logger/          # Logging (Pino adapter)
    ├── secrets/         # Secret management
    ├── http/            # HTTP client
    ├── cache/           # Cache interface + Redis adapter (in-memory fallback)
    ├── queue/           # JobQueue interface + BullMQ adapter (in-memory fallback)
    ├── database/        # Database interface
    ├── storage/         # File storage (S3/MinIO adapter)
    └── tracing/         # Observability
```

## Key Principles

1. **Clean Architecture**: Strict layer separation
2. **DRY**: Shared code in packages
3. **Environment Agnostic**: Code doesn't change between envs
4. **Modularity**: Easy microservices extraction
5. **Test Early**: Tests from day 1
6. **Security Progressive**: Add as we go (portfolio project)
7. **Documentation as Code**: Keep docs updated

## References

- [Architecture Overview](ARCHITECTURE.md)
- [Implementation Plan](IMPLEMENTATION_PLAN.md)
- [Commit Guide](COMMIT_GUIDE.md)
- [TypeScript Config Examples](TSCONFIG_EXAMPLES.md)

---

**Last Updated**: February 24, 2026  
**Status**: Phase 0 In Progress — domain + contracts implemented
