# Implementation Plan

> **Status:** In Progress — Phase 0  
> **Start Date:** January 22, 2026  
> **Estimated Duration:** 12-16 weeks (part-time)

This document outlines the phased implementation plan for the EcomSaaS platform, breaking down the work into manageable milestones with clear deliverables.

## Implementation Principles

1. **Incremental Delivery:** Each phase produces working software
2. **Test Early:** Tests added from Phase 1 onward
3. **Documentation as Code:** Keep docs updated with implementation
4. **Clean Architecture:** Maintain layer separation throughout
5. **Vertical Slices:** Complete features end-to-end before moving on

## Phase 0: Foundation (Week 1-4)

### 0.1 Shared Type System ✅

**Goal:** Establish TypeScript type definitions shared across all apps

**Status:** Complete — implemented as two packages following Clean Architecture boundary separation.

**Deliverables:**

- [x] Create `packages/domain/` — core entities, value objects, enums (zero dependencies)
- [x] Create `packages/contracts/` — DTOs, API protocol types (depends on domain)
- [x] Define entity interfaces: UserAccount, VendorProfile, Store, Product, Order, Subscription, Category, Supplier, Invite, Link, Log
- [x] Define value objects: Money (bigint, crypto-aware), Address, GeoPoint, Image, Schedule, Quantity
- [x] Implement MoneyVO class with arithmetic, factories, and formatting (extends ValueObject<Money>)
- [x] Define 20+ business enums: OrderStatus, PaymentMethod, AccountTier, StoreType, etc.
- [x] Define DTOs: auth, stores, products, orders, subscriptions
- [x] Define common types: ApiResponse, Pagination, ErrorCode, FilterOptions
- [x] Setup subpath exports for both packages
- [x] Configure tsup build (ESM, DTS, sourcemaps)

### 0.2 Shared Domain Layer ✅

**Goal:** Implement core business entities with business logic

**Status:** Complete — core DDD infrastructure, StoreModel, ProductModel, MoneyVO, and OrderModel implemented. Test suite has expanded to 280 tests across 6 files.

**Deliverables:**

- [x] Add core DDD building blocks: `Entity`, `AggregateRoot`, `ValueObject`, `Result<T,E>`, `DomainEvent`
- [x] Add typed domain error hierarchy: `DomainError`, `ValidationError`, `InvariantError`, `NotFoundError`
- [x] Add shared validators: `validateRequired`, `validateSlug`, `validateEmail`, `validateNonNegative`
- [x] Implement `StoreModel` — rich domain model wrapping Store entity interface
- [x] Implement `ProductModel` — rich domain model wrapping Product entity interface
- [x] Implement `MoneyVO` — value object with bigint arithmetic, crypto currencies, formatting
- [x] Implement `OrderModel` — rich domain model with state machine, MoneyVO calculations, guard/transition methods
- [x] Add unit tests (Vitest) — 280 tests across 6 test files

**Dependencies:** Phase 0.1

### 0.3 Remaining Domain Models ✅

**Goal:** Complete the domain model layer with remaining aggregate roots

**Status:** Complete — `SubscriptionModel` implemented with cadence logic, lifecycle transitions, and subscriber cap enforcement.

**Deliverables:**

- [x] Implement `SubscriptionModel` — cadence logic and subscriber cap enforcement
- [x] Document domain models (README or JSDoc)

**Dependencies:** Phase 0.2

### 0.4 Application Scaffolding ✅

**Goal:** Scaffold the NestJS API and Next.js frontend apps in their default form — no business logic, just working shells that build, lint, and serve.

**Status:** Complete — API and frontend shells exist, are wired into Turborepo, and build/test/lint/type-check successfully.

**Deliverables:**

- [x] Scaffold `backends/api/` with NestJS (default project with health check)
- [x] Scaffold `clients/storefront/` with Next.js 15 (App Router, Tailwind, default page)
- [x] Scaffold `clients/vendor/` with Next.js 15 (App Router, Tailwind, default page)
- [x] Wire all apps into Turborepo pipeline (build, lint, type-check, test)
- [x] Verify `pnpm build` succeeds for entire monorepo
- [x] Add `.gitignore` entries for app build outputs

**Structure:**

```
backends/api/          # NestJS — default scaffold + health endpoint
clients/storefront/    # Next.js — marketplace/store frontend shell
clients/vendor/        # Next.js — vendor dashboard frontend shell
```

**Notes:** These are intentionally bare-bones scaffolds. Business logic, auth, and database are added in later phases. The goal is to have buildable + deployable containers for CI/CD.

**Dependencies:** Phase 0.1 (monorepo tooling)

### 0.5 CI/CD & Infrastructure Foundation

**Goal:** Establish the deployment pipeline early so every subsequent feature can be validated in a real environment. Dockerize all apps, set up Terraform for a dev environment, and extend GitHub Actions for branch deployments.

**Deliverables:**

- [ ] Create `Dockerfile` for `backends/api/` (multi-stage, production-optimized)
- [ ] Create `Dockerfile` for `clients/storefront/` (multi-stage, standalone Next.js output)
- [ ] Create `Dockerfile` for `clients/vendor/` (multi-stage, standalone Next.js output)
- [ ] Create `docker-compose.yml` for local full-stack development (API + frontends + Redis + MinIO)
- [ ] Create `.dockerignore` files for each app
- [ ] Create `infra/terraform/` with basic dev environment:
  - [ ] Container registry (GCP Artifact Registry or AWS ECR)
  - [ ] Compute (Cloud Run or ECS for dev)
  - [ ] Networking basics (VPC, DNS)
  - [ ] Terraform state backend (GCS bucket or S3)
  - [ ] Environment-specific tfvars (`environments/dev/`)
- [ ] Extend GitHub Actions CI pipeline:
  - [ ] Build Docker images on PR
  - [ ] Push images to container registry on merge to main
  - [ ] Branch deployment: deploy preview environment per PR
  - [ ] Auto-cleanup preview on PR close
  - [ ] Comment PR with preview URLs

**Implemented Early (Security Exception):**

- [x] CI secret scanning with Gitleaks (`.github/workflows/ci.yml`, `.gitleaks.toml`)

**Structure:**

```
infra/
├── terraform/
│   ├── main.tf
│   ├── variables.tf
│   ├── outputs.tf
│   ├── modules/
│   │   ├── registry/      # Container registry
│   │   ├── compute/       # Cloud Run / ECS
│   │   └── networking/    # VPC, DNS, LB
│   └── environments/
│       └── dev/
│           ├── main.tf
│           └── terraform.tfvars

docker-compose.yml          # Local development stack
backends/api/Dockerfile
clients/storefront/Dockerfile
clients/vendor/Dockerfile
```

**Docker Compose (local dev):**

```yaml
services:
  api:
    build: ./backends/api
    ports: ['3000:3000']
    env_file: .env.local

  storefront:
    build: ./clients/storefront
    ports: ['3001:3000']
    env_file: .env.local

  vendor:
    build: ./clients/vendor
    ports: ['3002:3000']
    env_file: .env.local

  redis:
    image: redis:7-alpine
    ports: ['6379:6379']

  minio:
    image: minio/minio:latest
    ports: ['9000:9000', '9001:9001']
    command: server /data --console-address ':9001'
```

**Dependencies:** Phase 0.4 (scaffolded apps)

### 0.6 Shared Application Layer

**Goal:** Implement reusable use cases (business orchestration)

**Status:** Complete — shared application package delivered with ports, use cases, tests, and docs.

**Deliverables:**

- [x] Create `packages/application/`
- [x] Define repository interfaces (ports): `StoreRepository`, `ProductRepository`, `OrderRepository`, `IdGenerator`
- [x] Implement use cases: `GetStore`, `CreateProduct`, `PlaceOrder`
- [x] Add unit tests
- [x] Document use cases

**Dependencies:** Phase 0.2 (domain)

### 0.7 Shared Infrastructure Utilities — Foundation

**Goal:** Establish infrastructure abstraction layer with stable interfaces and reference implementations. Production adapters (Redis, BullMQ, Supabase, S3/MinIO, OpenTelemetry) will be implemented on-demand in later phases when first real consumer lands.

**Status:** Complete — foundation layer delivered with contracts + in-memory reference implementations for testing and early integration.

**Deliverables:**

- [x] `packages/infrastructure/id-generator/` — Crypto-based ID generation service (production-ready, uses Node.js crypto)
- [x] `packages/infrastructure/logger/` — Logging abstraction with Pino adapter (production-ready)
- [x] `packages/infrastructure/secrets/` — Secrets management interfaces with env and Infisical-backed adapters
- [x] `packages/infrastructure/http/` — HTTP client with retry, timeout, auth hooks, error handling (native fetch)
- [x] `packages/infrastructure/cache/` — Cache interface with in-memory reference implementation
- [x] `packages/infrastructure/queue/` — Queue interface with in-memory reference implementation
- [x] `packages/infrastructure/database/` — Database interface with stub reference implementation
- [x] `packages/infrastructure/storage/` — Object storage interface with in-memory reference implementation
- [x] `packages/infrastructure/tracing/` — Tracer interface with console/noop reference implementations
- [x] Comprehensive tests (121 tests) and documentation (README + JSDoc)

**Production Adapter Follow-ups (deferred to later phases):**

The following adapters will be implemented when first needed by application code:

- **Redis Cache Adapter** — Replace in-memory cache when Phase 1+ needs distributed caching
- **BullMQ Queue Adapter** — Replace in-memory queue when Phase 1+ needs persistent job queues
- **Supabase Database Adapter** — Add migration/connection utilities when Phase 1+ needs database helpers
- **S3/MinIO Storage Adapter** — Replace in-memory storage when Phase 1+ needs file uploads
- **OpenTelemetry Tracer Adapter** — Replace console tracer when observability requirements are defined
- **Startup Secrets Preload** — Fetch required secrets once on app bootstrap and inject typed runtime config

**Dependencies:** None (independent of other sub-phases)

**Note:** ID generation is now consumed through an application-layer port (`IdGenerator`)
and implemented by infrastructure adapter(s), preserving clean boundaries and SRP.

### 0.8 Shared Validation Layer

**Goal:** Centralized validation schemas

**Status:** Complete — validation package delivered with shared schemas, helpers, and tests.

**Deliverables:**

- [x] Create `packages/validation/`
- [x] Zod schemas for domain entities and API request DTOs
- [x] Validation helpers (`validateSchema`, `safeValidateSchema`)
- [x] Tests

**Dependencies:** Phase 0.1 (domain + contracts)

### 0.9 Shared UI Component Library

**Goal:** Reusable React components for frontends

**Deliverables:**

- [x] Create `packages/ui/`
- [x] Setup Tailwind + shadcn/ui
- [x] Implement base components: Button, Input, Card, Modal
- [x] Storybook for component documentation
- [x] Tests for core/web/native UI helpers (Vitest)

**Current Status Notes:**

- Shared tokens and core style contracts are implemented for cross-platform reuse.
- Web adapter components are implemented in `@ecomsaas/ui/web`.
- Native adapter style helpers are implemented in `@ecomsaas/ui/native`.
- Tailwind + shadcn primitives and Storybook stories are implemented in `packages/ui`.

**Dependencies:** None (independent of other sub-phases)

**Phase 0 Completion Criteria:**

- All packages and apps build successfully in Turborepo
- Docker images build and run for all 3 apps
- Docker Compose brings up the full local stack
- Terraform provisions a dev environment
- GitHub Actions builds images, runs tests, and deploys branch previews
- All tests passing
- Shared packages importable by `backends/` and `clients/` apps

---

## Phase 1: API Foundation (Week 5-6)

> **Note:** The NestJS shell was scaffolded in Phase 0.4. This phase adds database, auth, business logic, and the first real endpoint.

### 1.1 Database Setup

**Goal:** Connect to Supabase and setup migrations

**Status:** In Progress — foundation PR complete (schema + adapter + config wiring).

**Deliverables:**

- [x] Supabase local dev setup (Supabase CLI `init`, `config.toml`)
- [x] Initial database schema migration (`profiles`, `vendor_profiles`, `stores`)
- [x] Migration includes: enum types, RLS policies, auto-updated timestamps, indexes
- [x] Seed data script for local development (profiles + vendor + store linked to existing auth users)
- [x] `createSupabaseClient` factory in `@ecomsaas/infrastructure/database`
- [x] API bootstrap preload (secrets → `process.env` before NestJS boot)
- [x] Typed `AppConfig` + `REQUIRED_SECRET_KEYS` in `backends/api/src/config/`
- [x] NestJS `DatabaseModule` (global) exposing `SUPABASE_CLIENT` + `SUPABASE_ANON_CLIENT` tokens
- [x] `.env.example` documenting required variables
- [x] DECISIONS.md: Supabase client vs SQL Database interface architectural decision
- [ ] Repository pattern implementation (base repository + concrete implementations) → PR 2

**Notes:**

- Schema scope is intentionally narrowed to the 3 tables needed for the first vertical slice (Phase 1.3: `GET /stores/:slug`). Products and orders tables will be added in their respective slices.
- The `createSupabaseClient` factory is separate from the SQL `Database` interface. Repositories use the Supabase JS client (PostgREST) directly — see DECISIONS.md.

**Dependencies:** Phase 0.4 (scaffolded API), Phase 0.7 (infrastructure secrets)

### 1.2 Authentication Integration

**Goal:** Integrate Supabase Auth with NestJS

**Status:** Complete — auth guards, role strategy, and request-scoped JWT propagation implemented.

**Deliverables:**

- [x] Supabase client setup in API
- [x] JWT validation guard (SupabaseAuthGuard)
- [x] User extraction from token (`CurrentUser` decorator)
- [x] Role-based guards foundation (`Roles` decorator + `RolesGuard`)
- [x] Auth module scaffolding (`AuthModule`, `/auth/me`)
- [x] Tests for auth guards
- [x] Request-scoped JWT propagation into Supabase client context for `auth.uid()` RLS policies
- [x] Complete role strategy integration across feature modules/endpoints

**Future Improvement Options (after workflow baseline is stable):**

- Keep remote token validation with Supabase `auth.getUser(token)` (current baseline; simplest).
- Add local JWT verification with Supabase JWKS (`jose`) to reduce auth latency.
- Move JWT verification to an API gateway / edge layer for centralized auth checks.

### 1.3 First API Endpoint (Vertical Slice)

**Goal:** Implement `GET /api/v1/stores/:slug` as a vertical slice proving the full Clean Architecture stack

**Status:** Complete — stores vertical slice implemented with repository adapter, validation, mapping, role-aware endpoint, tests, and Swagger docs.

**Deliverables:**

- [x] StoresModule with controller and service
- [x] Wire GetStoreUseCase from application layer
- [x] Supabase StoreRepository implementation
- [x] DTO validation (Zod pipe)
- [x] Map domain entity to StoreResponse
- [x] Unit + integration tests
- [x] Swagger documentation

### 1.4 API Testing Framework

**Goal:** Establish comprehensive testing strategy

**Deliverables:**

- [ ] Unit test setup (Vitest or Jest)
- [ ] Integration test setup (supertest)
- [ ] Test database strategy (test containers or separate DB)
- [ ] Example tests for all layers
- [ ] CI integration

**Completion Criteria:**

- API runs locally on port 3000
- Health check returns 200
- GET /stores/:slug works end-to-end
- All tests passing
- Swagger UI accessible

---

## Phase 2: Frontend Implementation (Week 7-8)

> **Note:** Next.js shells were scaffolded in Phase 0.4. This phase adds Supabase auth, API integration, layouts, and routing.

### 2.1 Frontend Auth & API Integration

**Goal:** Setup API communication from frontends

**Deliverables:**

- [ ] HTTP client implementation (from `packages/infrastructure/http`)
- [ ] Auth token injection
- [ ] Error handling
- [ ] Retry logic
- [ ] TanStack Query setup for data fetching
- [ ] Example API call from frontend

**Example:**

```typescript
// clients/vendor/src/lib/api-client.ts
import { createHttpClient } from '@ecomsaas/infrastructure-http';

export const apiClient = createHttpClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  getToken: async () => {
    const session = await supabase.auth.getSession();
    return session.data.session?.access_token;
  },
});
```

### 2.2 Authentication UI

**Goal:** Login and registration flows for both apps

**Deliverables:**

- [ ] Login page (both apps)
- [ ] Registration page (vendor app)
- [ ] Password reset flow
- [ ] Protected route wrapper
- [ ] Auth state management (Zustand)
- [ ] Redirect logic after auth

**Completion Criteria:**

- Both apps run locally (different ports)
- Can register and login
- Protected pages require auth
- Can call API successfully

---

---

## Phase 3: Core Backend Implementation (Week 9-10)

### 3.1 Store Management API

**Goal:** Complete CRUD operations for stores

**Deliverables:**

- [ ] `POST /api/v1/stores` - Create store
- [ ] `GET /api/v1/stores/:id` - Get store by ID
- [ ] `GET /api/v1/stores/slug/:slug` - Get by slug
- [ ] `PUT /api/v1/stores/:id` - Update store
- [ ] `DELETE /api/v1/stores/:id` - Soft delete
- [ ] `GET /api/v1/stores` - List all (marketplace)
- [ ] Slug validation and uniqueness
- [ ] Tests and documentation

### 3.2 Product Management API

**Goal:** Complete product catalog operations

**Deliverables:**

- [ ] `POST /api/v1/products` - Create product
- [ ] `GET /api/v1/products/:id` - Get product
- [ ] `PUT /api/v1/products/:id` - Update product
- [ ] `DELETE /api/v1/products/:id` - Soft delete
- [ ] `GET /api/v1/stores/:storeId/products` - List store products
- [ ] **S3/MinIO Storage Adapter** for `@ecomsaas/infrastructure` (file uploads, presigned URLs)
- [ ] Image upload integration (using Storage adapter)
- [ ] Inventory management
- [ ] Tests and documentation

### 3.3 User & Vendor Management

**Goal:** User profile and vendor operations

**Deliverables:**

- [ ] `GET /api/v1/users/me` - Current user profile
- [ ] `PUT /api/v1/users/me` - Update profile
- [ ] `POST /api/v1/vendors` - Become vendor
- [ ] `GET /api/v1/vendors/:id` - Get vendor
- [ ] `PUT /api/v1/vendors/:id` - Update vendor
- [ ] Vendor verification flow
- [ ] Tests and documentation

### 3.4 Search & Filtering

**Goal:** Product and store search functionality

**Deliverables:**

- [ ] `GET /api/v1/search/products?q=...`
- [ ] `GET /api/v1/search/stores?q=...`
- [ ] Filtering by category, price range
- [ ] Sorting options
- [ ] Pagination
- [ ] Consider: PostgreSQL full-text search or Algolia

**Completion Criteria:**

- All core CRUD operations working
- Comprehensive tests
- Swagger docs complete
- Search functional

---

## Phase 4: Vendor App Development (Week 11-12)

### 4.1 Vendor Registration Flow

**Goal:** Complete vendor onboarding

**Deliverables:**

- [ ] Multi-step registration form
- [ ] Business information collection
- [ ] Store creation wizard
- [ ] Stripe Connect onboarding
- [ ] Email verification
- [ ] Success page with next steps

**Steps:**

1. Create account (Supabase Auth)
2. Business information
3. Store configuration (name, slug, description)
4. Stripe Connect setup
5. Confirmation

### 4.2 Store Dashboard

**Goal:** Vendor home page with overview

**Deliverables:**

- [ ] Store statistics (orders, revenue, products)
- [ ] Recent orders list
- [ ] Quick actions (add product, etc.)
- [ ] Store status indicator
- [ ] Charts (revenue over time)

### 4.3 Product Management UI

**Goal:** Full product CRUD in vendor app

**Deliverables:**

- [ ] Product list page
- [ ] Add product form (multi-step)
- [ ] Edit product page
- [ ] Delete product confirmation
- [ ] Image upload interface
- [ ] Inventory management UI
- [ ] Product variants (future)

### 4.4 Store Settings

**Goal:** Store configuration interface

**Deliverables:**

- [ ] Store information editor
- [ ] Branding settings (logo, colors)
- [ ] Domain/slug management
- [ ] Notification preferences
- [ ] Integration settings (Stripe, etc.)

**Completion Criteria:**

- Vendor can fully manage store
- All forms validated
- Good UX (loading states, errors)
- Mobile responsive

---

## Phase 5: Marketplace Development (Week 13-14)

### 5.1 Marketplace Home Page

**Goal:** Storefront discovery and browsing

**Deliverables:**

- [ ] Featured stores carousel
- [ ] Store listings with filters
- [ ] Search bar
- [ ] Category navigation
- [ ] Responsive design
- [ ] SEO optimization

### 5.2 Individual Store View (Subdomain)

**Goal:** Render vendor stores on subdomains

**Deliverables:**

- [ ] Store page with branding
- [ ] Product grid/list
- [ ] Product detail page
- [ ] Store information section
- [ ] Search within store
- [ ] SSG/ISR for performance

**Example:** `acme-store.oursite.com`

### 5.3 Product Detail Pages

**Goal:** Rich product presentation

**Deliverables:**

- [ ] Image gallery
- [ ] Product information
- [ ] Price and availability
- [ ] Add to cart button
- [ ] Related products
- [ ] Vendor information
- [ ] Basic meta tags

**Note:** Advanced SEO optimization (Open Graph, structured data, sitemaps) deferred to later phase

### 5.4 Shopping Cart

**Goal:** Multi-vendor cart implementation

**Deliverables:**

- [ ] Cart state management (Zustand)
- [ ] Add/remove items
- [ ] Quantity updates
- [ ] Cart grouping by vendor
- [ ] Cart persistence (localStorage + sync to backend)
- [ ] Cart preview (dropdown/sidebar)
- [ ] Empty cart state

**Multi-Vendor Cart Structure:**

```typescript
{
  items: [
    {
      storeId: 'store-1',
      storeName: 'Acme Store',
      products: [
        { productId: 'p1', quantity: 2, price: 10.0 },
        { productId: 'p2', quantity: 1, price: 25.0 },
      ],
    },
    {
      storeId: 'store-2',
      storeName: 'Beta Shop',
      products: [{ productId: 'p3', quantity: 1, price: 15.0 }],
    },
  ];
}
```

**Completion Criteria:**

- Marketplace fully browsable
- Store pages render correctly on subdomains
- Cart works across multiple vendors
- Good performance (Lighthouse score > 90)

---

## Phase 6: Order & Payment System (Week 15-16)

### 6.1 Checkout Flow

**Goal:** Complete checkout implementation

**Deliverables:**

- [ ] Checkout page
- [ ] Shipping information form
- [ ] Payment method selection
- [ ] Order summary
- [ ] Multi-vendor order splitting
- [ ] Loading and error states
- [ ] Order confirmation page

### 6.2 Stripe Payment Integration

**Goal:** Payment processing with Stripe Connect

**Deliverables:**

- [ ] Stripe Connect setup for vendors
- [ ] Payment Intent creation (split per vendor)
- [ ] Platform fee calculation
- [ ] Payment confirmation
- [ ] Webhook handling (payment succeeded, failed)
- [ ] Refund capability
- [ ] Tests with Stripe test mode

**Flow:**

1. Customer submits order
2. API creates PaymentIntent for each vendor
3. Frontend collects payment (Stripe Elements)
4. Webhooks confirm payment
5. Order marked as paid

### 6.3 Order Management API

**Goal:** Order CRUD and status management

**Deliverables:**

- [ ] `POST /api/v1/orders` - Create order
- [ ] `GET /api/v1/orders/:id` - Get order
- [ ] `GET /api/v1/orders` - List orders (customer view)
- [ ] `GET /api/v1/vendors/:id/orders` - Vendor orders
- [ ] `PUT /api/v1/orders/:id/status` - Update status
- [ ] Order state machine (pending → paid → fulfilled → completed)
- [ ] Email notifications (order confirmation, shipping)
- [ ] Tests

### 6.4 Order Management UI

**Goal:** Order views for customers and vendors

**Deliverables:**

**Customer Side (Marketplace):**

- [ ] Order history page
- [ ] Order detail page
- [ ] Order tracking
- [ ] Download invoice

**Vendor Side (Vendor App):**

- [ ] Orders list (filterable)
- [ ] Order detail page
- [ ] Fulfill order action
- [ ] Print packing slip
- [ ] Order analytics

**Completion Criteria:**

- End-to-end order flow working
- Payments processing correctly
- Vendors receive payouts
- Customers receive confirmations
- All edge cases handled

---

## Phase 7: Background Jobs & Worker (Week 17)

### 7.1 Message Queue Setup

**Goal:** Setup BullMQ for async job processing

**Deliverables:**

- [ ] Redis setup (production)
- [ ] **Redis Cache Adapter** for `@ecomsaas/infrastructure` (ioredis client, TTL support)
- [ ] **BullMQ Queue Adapter** for `@ecomsaas/infrastructure` (producer/consumer, job retry)
- [ ] BullMQ configuration
- [ ] Job queue definitions
- [ ] Queue monitoring UI (Bull Board)

### 7.2 Background Worker App

**Goal:** Lightweight worker for job submission

**Deliverables:**

- [ ] Create `backends/worker/` (simple Node.js app)
- [ ] Job submission utilities
- [ ] Scheduled task triggers (cron)
- [ ] Shared queue configuration (`packages/infrastructure/queue`)
- [ ] Logging integration

**Architecture Note:**

- Worker submits jobs to queue (producer)
- API processes jobs (consumer) with registered handlers
- Keeps worker lightweight, business logic in API
- Alternative approach: API could handle both producing and consuming

### 7.3 Job Implementations

**Goal:** Implement critical background jobs

**Deliverables:**

- [ ] Email sending job
- [ ] Payment reconciliation job
- [ ] Order sync job (if needed)
- [ ] Inventory update job
- [ ] Report generation job
- [ ] Scheduled jobs (cron)

**Example Job:**

```typescript
// Email job
queueJobs.process('send-email', async (job) => {
  const { to, subject, body } = job.data;
  await emailService.send(to, subject, body);
});
```

**Completion Criteria:**

- Worker processing jobs reliably
- Failed jobs retry appropriately
- Monitoring dashboard accessible
- Critical paths offloaded from API

---

## Phase 8: Blockchain Integration (Week 18-20)

### 8.1 Smart Contract Development

**Goal:** Solidity contracts for fundraising and rewards

**Deliverables:**

- [ ] Create `blockchain/contracts/`
- [ ] Fundraising contract (ERC20 token issuance)
- [ ] Rewards contract (token distribution)
- [ ] Unit tests (Hardhat)
- [ ] Deploy to Polygon testnet (Mumbai)
- [ ] Contract verification

### 8.2 Web3 Integration (Frontend)

**Goal:** Connect wallets and interact with contracts

**Deliverables:**

- [ ] Wallet connection (MetaMask, WalletConnect)
- [ ] wagmi/viem setup
- [ ] Network switching (Polygon mainnet/testnet)
- [ ] Contract interaction hooks
- [ ] Transaction status handling
- [ ] UI components for Web3 features

### 8.3 Crypto Payment Feature

**Goal:** Accept crypto payments for products

**Deliverables:**

- [ ] Crypto payment option in checkout
- [ ] Price conversion (USD to crypto)
- [ ] Payment confirmation (on-chain)
- [ ] Webhook/listener for payment events
- [ ] Reconciliation with orders
- [ ] Vendor payout in crypto

### 8.4 Fundraising Feature

**Goal:** Vendors can raise funds via token issuance

**Deliverables:**

- [ ] Token creation UI (vendor app)
- [ ] Token sale parameters setup
- [ ] Investment flow (marketplace)
- [ ] Token distribution
- [ ] Investor dashboard
- [ ] Legal disclaimer (important!)

### 8.5 Rewards System

**Goal:** Token-based loyalty program

**Deliverables:**

- [ ] Reward token distribution on purchases
- [ ] Token balance display
- [ ] Redeem tokens for discounts
- [ ] Token transfer between users
- [ ] Vendor acceptance configuration

**Completion Criteria:**

- Smart contracts deployed and verified
- Wallet connection working
- Crypto payments functional
- Fundraising flows complete
- Rewards system operational
- All on testnet first, mainnet later

---

## Phase 9: MCP Server (Week 21)

### 9.1 MCP Server Setup

**Goal:** AI chat backend for vendor assistance

**Deliverables:**

- [ ] Create `backends/mcp/`
- [ ] MCP protocol implementation
- [ ] Connect to API (internal HTTP client)
- [ ] Authentication/authorization
- [ ] Rate limiting

### 9.2 Tools/Functions Implementation

**Goal:** Define available tools for AI

**Deliverables:**

- [ ] `getStoreInfo` tool
- [ ] `listProducts` tool
- [ ] `createProduct` tool
- [ ] `updateStoreSettings` tool
- [ ] `getOrderStats` tool
- [ ] JSON schema for all tools

### 9.3 Chat UI Integration

**Goal:** Chat interface in vendor app

**Deliverables:**

- [ ] Chat widget component
- [ ] Message history
- [ ] Streaming responses
- [ ] Tool execution visualization
- [ ] Feedback mechanism

**Completion Criteria:**

- Vendors can interact with AI
- AI can perform store management tasks
- Chat history persisted
- Good UX for tool execution

---

## Phase 10: Polish & Production Readiness (Week 22-24)

### 10.1 Security Hardening

**Goal:** Production-grade security

**Deliverables:**

- [ ] Rate limiting (API)
- [ ] Input sanitization review
- [ ] SQL injection audit
- [ ] XSS protection audit
- [ ] CSRF protection
- [ ] Security headers (CSP, HSTS)
- [ ] Dependency vulnerability scan
- [ ] Penetration testing (basic)

### 10.2 Performance Optimization

**Goal:** Optimize for speed and scale

**Deliverables:**

- [ ] Database query optimization
- [ ] N+1 query fixes
- [ ] Redis caching implementation
- [ ] CDN setup for static assets
- [ ] Image optimization
- [ ] Code splitting (frontend)
- [ ] Lazy loading
- [ ] Lighthouse audit (score > 90)

### 10.3 Monitoring & Observability

**Goal:** Production monitoring setup

**Deliverables:**

- [ ] **OpenTelemetry Tracer Adapter** for `@ecomsaas/infrastructure` (distributed tracing, spans, metrics)
- [ ] Application logs aggregation
- [ ] Error tracking (Sentry)
- [ ] Performance monitoring (APM)
- [ ] Uptime monitoring
- [ ] Alert configuration
- [ ] Dashboard creation
- [ ] Analytics integration

### 10.4 Documentation

**Goal:** Complete documentation

**Deliverables:**

- [ ] API documentation (OpenAPI)
- [ ] User guides (vendor and customer)
- [ ] Deployment runbook
- [ ] Troubleshooting guide
- [ ] Architecture diagrams
- [ ] Video demos/tutorials

### 10.5 Testing

**Goal:** Comprehensive test coverage

**Deliverables:**

- [ ] Unit test coverage > 80%
- [ ] Integration test suite
- [ ] E2E tests for critical flows
- [ ] Load testing
- [ ] Cross-browser testing
- [ ] Mobile testing

**Completion Criteria:**

- All production checks passing
- Performance targets met
- Monitoring operational
- Documentation complete
- Ready for public launch

---

## Success Metrics

### Phase Completion Criteria

Each phase should meet:

- [ ] All deliverables completed
- [ ] Tests passing (> 80% coverage)
- [ ] Documentation updated
- [ ] Code reviewed
- [ ] Deployed to staging
- [ ] Demo-able

### Overall Project Success

- [ ] All user stories implemented
- [ ] Platform stable (uptime > 99%)
- [ ] Performance targets met
- [ ] Security audit passed
- [ ] Documentation complete
- [ ] Portfolio-ready (screenshots, video)

## Risk Mitigation

### Technical Risks

| Risk                      | Impact | Mitigation                                |
| ------------------------- | ------ | ----------------------------------------- |
| Supabase limitations      | High   | Plan migration path, abstract data access |
| Stripe Connect complexity | Medium | Start integration early, test thoroughly  |
| Subdomain routing issues  | Medium | Use established patterns, test early      |
| Blockchain gas fees       | Low    | Use Polygon (low fees), testnet first     |
| Monorepo complexity       | Low    | Strong architecture, good tooling (Turbo) |
| Performance at scale      | Medium | Implement caching early, load testing     |

### Timeline Risks

| Risk                      | Impact | Mitigation                                  |
| ------------------------- | ------ | ------------------------------------------- |
| Feature creep             | High   | Strict scope management, MVP first          |
| Underestimated complexity | Medium | Buffer time, regular reassessment           |
| Blockchain learning curve | Medium | Allow extra time, focus on simple contracts |
| Integration challenges    | Medium | Early proof-of-concepts, incremental        |

## Notes

- This is a **portfolio project**, not production system (initially)
- Security is progressive, not all at once
- Timelines are estimates for part-time work
- Phases can overlap if dependencies allow
- Regular demos/checkpoints recommended
- Adjust plan based on learnings

## Next Steps

1. ✅ Review and approve this implementation plan
2. ✅ Complete Phase 0.1 (Shared Type System — domain + contracts)
3. ✅ Setup project tracking (GitHub Projects/Issues)
4. ✅ Establish branch strategy and commit conventions
5. ✅ Complete Phase 0.2 (Rich Domain Models with business logic)
6. ✅ Complete Phase 0.3 (Remaining domain models)
7. ✅ Complete Phase 0.4 (NestJS + Next.js scaffolding)
8. ✅ Complete Phase 0.6 (Application Layer — use cases and repository interfaces)
9. ✅ Complete Phase 0.7 (Infrastructure foundation/scaffold)
10. ✅ Complete Phase 0.8 (Shared Validation Layer — Zod schemas)
11. Begin Phase 1.1 (Database setup + repository pattern + Supabase adapter)
12. Defer Phase 0.5 (CI/CD and infrastructure foundation) to end-of-roadmap
