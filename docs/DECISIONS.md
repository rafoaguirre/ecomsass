# Technical Decisions Summary

> Quick reference for key architectural and implementation decisions made for the EcomSaaS project.

## Core Technology Decisions

### Message Queue: **BullMQ**

- ✅ Priority-based queuing
- ✅ Cloud-agnostic (works on GCP, AWS, any Redis)
- ✅ Easy to dockerize
- Architecture: Worker submits jobs → API processes them

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
- Wrapper utility in `packages/infrastructure/cache`

### Environment Management

- **Principle**: Code identical across environments
- **What changes**: Only secrets/configuration
- **Local**: .env files
- **Cloud**: GCP Secret Manager / AWS Secrets Manager

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
├── application/         # Use cases (planned)
├── ui/                  # React components (planned)
├── utils/               # Pure utilities (planned)
├── config/              # Configurations (planned)
├── validation/          # Zod schemas (planned)
└── infrastructure/      # Infra utilities (planned)
    ├── logger/          # Logging
    ├── secrets/         # Secret management
    ├── http/            # HTTP client
    ├── cache/           # Redis wrapper
    ├── queue/           # BullMQ wrapper
    ├── database/        # Migration wrapper
    ├── storage/         # File storage wrapper
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
