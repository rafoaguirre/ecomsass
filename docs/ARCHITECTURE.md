# EcomSaaS Architecture

> **Version:** 1.0.0  
> **Last Updated:** January 22, 2026  
> **Status:** Planning Phase

## Overview

EcomSaaS is a multi-tenant e-commerce platform that enables vendors to create and manage their own online stores with integrated blockchain features for crypto payments and fundraising.

## Core Features

### 1. Multi-Tenant Store Management

- Vendors register and create customized online stores
- Each store accessible via:
  - Subdomain routing: `{store-slug}.oursite.com`
  - Marketplace listing: Central discovery platform
- Store configuration via traditional forms and AI chat interface

### 2. Product & Subscription Management

- Product catalog management
- Subscription-based products
- Inventory tracking
- Order management
- Multi-vendor cart support in marketplace

### 3. User Roles & Access

**Vendors:**

- Manage own store
- Post products/subscriptions
- View analytics and orders
- Can shop on marketplace (purchases tagged as inventory)

**Customers:**

- Browse marketplace
- Shop from multiple vendors in single cart
- Order tracking
- Subscription management

### 4. Payment Processing

**Traditional Payments:**

- Stripe integration
- Multi-vendor payment splitting (Stripe Connect)
- Subscription billing

**Blockchain Payments:**

- Crypto payments via Polygon chain
- Store fundraising through token issuance
- Rewards system (token accumulation)

### 5. AI-Powered Management

- MCP server for vendor-AI chat interaction
- Natural language store configuration
- Automated assistance for common tasks

## System Architecture

### High-Level Components

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Layer                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Vendor     │  │ Marketplace  │  │   Mobile     │          │
│  │   Web App    │  │   Web App    │  │   (Future)   │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
└─────────┼──────────────────┼──────────────────┼──────────────────┘
          │                  │                  │
          └──────────────────┼──────────────────┘
                             │
┌─────────────────────────────────────────────────────────────────┐
│                      API Gateway / CDN                           │
│                   (Cloudflare / Nginx)                           │
└─────────────────────────┬───────────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          │               │               │
┌─────────▼─────┐  ┌──────▼──────┐  ┌────▼────────┐
│               │  │             │  │             │
│   Main API    │  │  MCP Server │  │  Background │
│  (NestJS)     │  │  (AI Chat)  │  │   Worker    │
│               │  │             │  │  (Jobs)     │
└───────┬───────┘  └──────┬──────┘  └────┬────────┘
        │                 │              │
        └─────────────────┼──────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
┌───────▼────────┐ ┌──────▼──────┐ ┌───────▼────────┐
│                │ │             │ │                │
│   Supabase     │ │   Redis     │ │   Message      │
│   (Auth+DB)    │ │  (Cache+    │ │   Queue        │
│                │ │   Queue)    │ │  (BullMQ)      │
└────────────────┘ └─────────────┘ └────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    External Services                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │    Stripe    │  │   Polygon    │  │   Supabase   │          │
│  │   Payments   │  │  Blockchain  │  │   Storage    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

### Technology Stack

#### **Frontend Applications**

- **Framework:** Next.js 15+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **State Management:** Zustand / TanStack Query
- **Forms:** React Hook Form + Zod validation
- **Build:** Turbo (monorepo orchestration)

#### **Backend Services**

- **Main API:** NestJS (TypeScript)
- **MCP Server:** Node.js / TypeScript
- **Background Worker:** Node.js / TypeScript
- **API Documentation:** Swagger / OpenAPI
- **Testing:** Vitest / Jest

#### **Data Layer**

- **Primary Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **Caching:** Redis (catalogues, frequently accessed data)
- **Message Queue:** BullMQ (Redis-based, priority queuing, cloud-agnostic)
- **File Storage:**
  - Production: Supabase Storage / GCP Cloud Storage / AWS S3
  - Local Development: MinIO (S3-compatible Docker container)

#### **Payments & Blockchain**

- **Payments:** Stripe + Stripe Connect (multi-vendor)
- **Blockchain:** Polygon (MATIC)
- **Smart Contracts:** Solidity
- **Web3 Integration:** ethers.js / wagmi

#### **Infrastructure (Planned)**

- **Cloud Provider:** GCP / AWS (Terraform)
- **CDN:** Cloudflare
- **CI/CD:** GitHub Actions
- **Containers:** Docker
- **Orchestration:** Kubernetes (production)

## Clean Architecture Implementation

This project follows Clean Architecture principles with clear separation between layers:

### Architectural Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                        │
│  (UI, API Controllers, Routes, Components)                   │
│  - frameworks/web/         (Next.js apps)                    │
│  - frameworks/api/         (NestJS controllers)              │
└─────────────────────┬───────────────────────────────────────┘
                      │ Depends on ↓
┌─────────────────────▼───────────────────────────────────────┐
│                   Application Layer                          │
│  (Use Cases, Business Rules, Orchestration)                  │
│  - packages/application/   (Shared use cases)                │
│  - GetOrders, CreateStore, ProcessPayment                    │
└─────────────────────┬───────────────────────────────────────┘
                      │ Depends on ↓
┌─────────────────────▼───────────────────────────────────────┐
│                    Domain Layer                              │
│  (Entities, Value Objects, Business Logic)                   │
│  - packages/domain/        (Shared domain models)            │
│  - User, Order, Product, Store, Payment                      │
└─────────────────────┬───────────────────────────────────────┘
                      │ Implemented by ↑
┌─────────────────────▼───────────────────────────────────────┐
│                 Infrastructure Layer                         │
│  (External Services, DB, APIs, File System)                  │
│  - Each app has its own infrastructure                       │
│  - Database repos, HTTP clients, Email services              │
└─────────────────────────────────────────────────────────────┘
```

### Dependency Rule

- Inner layers **NEVER** depend on outer layers
- Domain layer is completely independent (pure business logic)
- Application layer depends only on domain
- Infrastructure implements interfaces defined in inner layers
- Presentation layer orchestrates everything

### Shared vs App-Specific Code

**Shared Packages:**

- `packages/domain/` - Core domain layer: entities, value objects, enums (zero dependencies)
- `packages/contracts/` - API contracts, DTOs, shared protocol types (depends on domain)
- `packages/application/` - Business use cases _(planned)_
- `packages/utils/` - Pure utility functions _(planned)_
- `packages/config/` - Shared configuration _(planned)_
- `packages/validation/` - Shared validation schemas (Zod) _(planned)_
- `packages/ui/` - Shared UI components (React) _(planned)_
- `packages/infrastructure/` - Shared infra utilities _(planned)_

**App-Specific:**

- Infrastructure implementations differ per app:
  - API: Direct database access
  - Frontend: API HTTP calls
  - Worker: Queue consumers
- Each app implements its own infrastructure layer

## Monorepo Structure

```
ecomsaas/
├── backends/
│   ├── api/                    # Main NestJS API
│   ├── worker/                 # Background job processor
│   └── mcp/                    # MCP server for AI chat
├── clients/
│   ├── vendor/                 # Vendor management app (Next.js)
│   └── storefront/             # Customer storefront + stores (Next.js)
├── blockchain/
│   └── contracts/              # Solidity smart contracts
├── packages/
│   ├── domain/                 # Core domain layer (entities, value objects, enums)
│   ├── contracts/              # API contracts, DTOs, shared protocol types
│   ├── application/            # Shared use cases (planned)
│   ├── ui/                     # Shared UI components (planned)
│   ├── utils/                  # Shared utilities (planned)
│   ├── config/                 # Shared configurations (planned)
│   ├── validation/             # Shared validation schemas — Zod (planned)
│   └── infrastructure/         # Shared infra utilities (planned)
│       ├── logger/             # Logging utility
│       ├── secrets/            # Secrets manager wrapper
│       ├── http/               # HTTP client wrapper
│       ├── cache/              # Redis caching wrapper
│       ├── queue/              # BullMQ queue wrapper
│       ├── database/           # Database migration wrapper (Supabase)
│       ├── storage/            # File storage wrapper (MinIO/S3/Supabase)
│       └── tracing/            # Observability/tracing
├── infra/
│   ├── terraform/              # IaC configurations
│   ├── kubernetes/             # K8s manifests
│   └── docker/                 # Dockerfiles
├── docs/
│   ├── architecture/           # Architecture docs
│   ├── api/                    # API documentation
│   └── guides/                 # Development guides
└── scripts/
    ├── setup/                  # Setup scripts
    └── deploy/                 # Deployment scripts
```

## Key Architectural Decisions

### 1. Multi-Tenancy via Subdomains

**Decision:** Each vendor store accessible via `{slug}.oursite.com`

**Primary Implementation:** Next.js middleware for subdomain routing

**Advantages of Next.js Middleware:**

- No external service dependency
- Direct access to request context
- Easy local development
- Simplified deployment (single app)
- Full control over routing logic

**Alternative: Cloudflare Workers**

- Pros: Edge routing (faster), DDoS protection, independent of Next.js
- Cons: Additional complexity, external dependency, harder local testing
- Decision: Evaluate if performance demands it later

**Implementation Details:**

- DNS wildcard configuration: `*.oursite.com`
- Next.js middleware extracts subdomain from hostname
- Store lookup and routing based on subdomain
- Rewrite to `/store/[slug]` route internally

**Alternatives Considered:**

- Path-based: `oursite.com/stores/{slug}` (less professional, worse SEO)
- Separate domains: Expensive, complex DNS management

### 2. Supabase as Backend-as-a-Service

**Decision:** Use Supabase for auth, database, and edge functions

**Benefits:**

- Rapid development (auth out of the box)
- PostgreSQL with Row Level Security (RLS)
- Realtime subscriptions for live updates
- Supabase Storage for file uploads
- Edge functions for scheduled tasks

**Considerations:**

- Vendor lock-in (acceptable for portfolio project)
- May need database abstraction layer if migrating later
- Self-hosted option available if needed

**Real-Time Features:**

- **Supabase Realtime** for database change subscriptions
- Use cases:
  - Order status updates (customer and vendor views)
  - Inventory sync across apps
  - Live notifications
- Implementation: Subscribe to specific tables/rows in frontend
- No separate real-time service needed (Supabase handles it)
- Efficient: Only relevant clients receive updates via WebSocket

### 3. NestJS for Main API

**Decision:** Use NestJS framework for API server in **modular monolith** pattern

**Modular Monolith Approach:**

- Single deployable application
- Organized into feature modules (Auth, Stores, Products, Orders, etc.)
- Each module is self-contained with clear boundaries
- Modules communicate via well-defined interfaces
- Easy to extract into microservices later if needed
- Benefits: Simpler deployment, shared code, easier transactions

**Module Structure Example:**

```
src/
├── modules/
│   ├── auth/         # Authentication module
│   ├── stores/       # Store management
│   ├── products/     # Product catalog
│   ├── orders/       # Order processing
│   └── payments/     # Payment handling
└── common/           # Shared utilities
```

**Rationale:**

- Excellent TypeScript support
- Built-in support for clean architecture patterns
- Dependency injection out of the box
- OpenAPI documentation generation (Swagger)
- Easy testing with built-in utilities
- Modular architecture ready for microservices extraction
- REST API support (primary)
- No API versioning initially (add when needed)

### 4. Stripe Connect for Multi-Vendor Payments

**Decision:** Use Stripe Connect for payment splitting

**Implementation:**

- Each vendor gets Stripe Connect account
- Platform charges platform fee
- Automatic payment distribution
- Handles marketplace complexity

**Alternatives:**

- Manual distribution: Complex, requires escrow
- Different payment processor: Less robust

### 5. Shared Domain Layer

**Decision:** Single source of truth for domain models

**Benefits:**

- Consistency across all apps
- Type safety (TypeScript)
- Business logic centralized
- Easier refactoring

**Trade-offs:**

- Changes affect all apps
- Need careful versioning
- Must maintain backward compatibility

### 6. Message Queue for Async Processing

**Decision:** Use BullMQ (Redis-based) for job queue

**Use Cases:**

- Order processing
- Email notifications
- Payment reconciliation
- Blockchain transaction monitoring
- Inventory sync

**Rationale:**

- Prevents API timeout on long operations
- Retry logic built-in
- **Priority-based queuing** (critical jobs processed first)
- Cloud-agnostic (works on GCP, AWS, or any Redis instance)
- Easy to Dockerize for local development
- Monitoring and debugging tools (Bull Board)
- API acts as both producer and consumer of queue items

**Architecture Pattern:**

- Background worker submits job to queue
- API server processes jobs with registered handlers
- Shared queue configuration in `packages/infrastructure/queue`

### 7. Monorepo with Turborepo

**Decision:** Single repository for entire platform

**Benefits:**

- Shared code management
- Atomic commits across services
- Unified CI/CD
- Easier refactoring
- Consistent tooling

**Challenges:**

- Requires disciplined architecture
- CI/CD needs smart caching
- May need code ownership rules

## Data Model (High-Level)

### Core Entities

**User:**

- id, email, role (vendor | customer)
- profile (name, avatar, etc.)
- Supabase auth integration

**Vendor:**

- id, userId, businessInfo
- stripeConnectAccountId
- settings

**Store:**

- id, vendorId, slug, name, description
- theme, branding
- isActive

**Product:**

- id, storeId, name, description, price
- inventory, images
- type (physical | digital | subscription)

**Order:**

- id, customerId, storeId, status
- items, subtotal, tax, total
- paymentIntentId (Stripe)

**Subscription:**

- id, customerId, productId
- status, billingCycle
- stripeSubscriptionId

**BlockchainWallet:**

- id, userId, address
- chain (polygon)

**Token:**

- id, name, symbol, contractAddress
- storeId (if store-specific token)

### Database Strategy

- **Supabase PostgreSQL** as primary database
- **Row Level Security (RLS)** for tenant isolation
- **Migrations**: Supabase CLI wrapped in `packages/infrastructure/database`
  - Abstraction layer allows future migration to different tools
  - Centralized migration management
  - Environment-aware (dev, staging, production)

**Schema Organization (Clean Architecture):**

- **Domain Layer** (`packages/domain/`): Core entities (User, Store, Product)
  - Pure business logic, no database specifics
  - Framework-agnostic

- **Application Layer** (`packages/application/`): Use cases
  - Repository interfaces (ports)
  - No implementation details

- **Infrastructure Layer** (per app): Database adapters
  - API: Supabase client with direct DB access
  - Frontend: HTTP client calling API
  - Adapters implement repository interfaces
  - SQL schemas, queries, and ORM code here

- **Contracts** (`packages/contracts/`): DTOs & API protocol types
  - Shared across application and infrastructure layers
  - Depends on domain entities (inward-pointing dependency)
  - Request/response shapes, pagination, error types

## API Design

### RESTful Conventions

```
/api/v1/
├── /auth                       # Authentication
├── /users                      # User management
├── /vendors                    # Vendor profiles
├── /stores                     # Store management
├── /products                   # Product catalog
├── /orders                     # Order management
├── /subscriptions              # Subscription handling
├── /payments                   # Payment processing
├── /blockchain                 # Blockchain operations
└── /webhooks                   # External webhooks (Stripe, etc.)
```

### API Versioning

- Version in URL path: `/api/v1/`
- Semantic versioning
- Deprecation policy: 6 months notice

### Authentication

- **Strategy:** JWT tokens from Supabase Auth
- **Headers:** `Authorization: Bearer <token>`
- **Refresh:** Automatic with Supabase client
- **Scopes:** Role-based (vendor, customer, admin)

### Error Handling

```typescript
{
  "error": {
    "code": "PRODUCT_NOT_FOUND",
    "message": "Product with id 123 not found",
    "statusCode": 404,
    "timestamp": "2026-01-22T10:00:00Z"
  }
}
```

## Security Considerations

> **Note:** This is a portfolio project with security being added progressively. Initial implementation focuses on core functionality with basic security measures. Production-grade security hardening will be implemented in later phases.

### Current Security Measures

- Supabase Auth for authentication
- HTTPS everywhere
- Environment variable management
- Input validation (Zod schemas)
- SQL injection prevention (ORM)

### Future Security Enhancements

- Rate limiting and DDoS protection
- Advanced RBAC (Role-Based Access Control)
- Security audit and penetration testing
- PCI DSS compliance for payments
- Regular dependency vulnerability scanning
- WAF (Web Application Firewall)
- Security headers (CSP, HSTS, etc.)
- Data encryption at rest
- Comprehensive audit logging

## Development Workflow

### Local Development

1. Clone monorepo
2. Install dependencies: `pnpm install`
3. Setup local Supabase (or use cloud instance)
4. Configure environment variables
5. Run all apps: `pnpm dev`
6. Access:
   - API: `http://localhost:3000`
   - Vendor App: `http://localhost:3001`
   - Marketplace: `http://localhost:3002`

### Environment Configuration

**Principle:** Code remains identical across all environments; only secrets/config change

```
.env.local                     # Local development
.env.development               # Development environment
.env.staging                   # Staging environment
.env.production                # Production environment
```

**Secrets Management:**

- Local: `.env` files
- Cloud: GCP Secret Manager / AWS Secrets Manager
- Wrapper in `packages/infrastructure/secrets` abstracts provider
- Environment-aware: loads from appropriate source

**Local Development Infrastructure:**

- Docker Compose for infrastructure services
- Services included:
  - PostgreSQL (if not using Supabase cloud)
  - Redis (caching + queue)
  - MinIO (S3-compatible storage)
- Matches production services for consistency
- Easy onboarding: `docker-compose up`

### Testing Strategy

- **Unit Tests:** Domain and application layers
- **Integration Tests:** API endpoints
- **E2E Tests:** Critical user flows
- **Contract Tests:** API contracts
- **Load Tests:** Performance validation

### Deployment Pipeline

```
Commit → GitHub Actions → Build → Test → Deploy
                            ↓
                    Docker Images → Registry
                            ↓
                    Staging Environment
                            ↓
                    Manual Approval
                            ↓
                    Production Environment
```

## References

- [Clean Architecture - DrunknCode](https://medium.com/@DrunknCode/clean-architecture-simplified-and-in-depth-guide-026333c54454)
- [Clean Architecture Explained - Rafael](https://medium.com/@rafael-22/the-clean-architecture-i-wish-someone-had-explained-to-me-dcc1572dbeac)
- [Clean Architecture - GDG VIT](https://medium.com/gdg-vit/clean-architecture-the-right-way-d83b81ecac6)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Turborepo Documentation](https://turbo.build/repo/docs)
- [NestJS Documentation](https://docs.nestjs.com/)
- [Supabase Documentation](https://supabase.com/docs)
