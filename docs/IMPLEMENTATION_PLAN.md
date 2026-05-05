# Implementation Plan

> **Status:** In Progress — Phase 7.4 underway; worker infrastructure is complete, scheduled job business logic is still pending  
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

**Status:** Complete — database schema, Supabase client, config wiring, and repository pattern all implemented.

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
- [x] Repository pattern implementation (base repository + concrete implementations)

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

**Status:** Complete — Vitest unit tests + supertest e2e tests established across all modules (89 unit, 46 e2e).

**Deliverables:**

- [x] Unit test setup (Vitest)
- [x] Integration test setup (supertest)
- [x] Test database strategy (mock Supabase client with factory helpers)
- [x] Example tests for all layers
- [x] CI integration

**Completion Criteria:**

- API runs locally on port 3000
- Health check returns 200
- GET /stores/:slug works end-to-end
- All tests passing
- Swagger UI accessible

---

## Phase 2: Core Backend Implementation (Week 7-8)

### 2.1 Store Management API

**Goal:** Complete CRUD operations for stores

**Status:** Complete — full CRUD with slug validation, marketplace listing, ownership guards, PublicStoreResponse for public endpoints.

**Deliverables:**

- [x] `POST /api/v1/stores` - Create store
- [x] `GET /api/v1/stores/:id` - Get store by ID
- [x] `GET /api/v1/stores/slug/:slug` - Get by slug
- [x] `PUT /api/v1/stores/:id` - Update store
- [x] `DELETE /api/v1/stores/:id` - Soft delete
- [x] `GET /api/v1/stores` - List all (marketplace)
- [x] Slug validation and uniqueness
- [x] Tests and documentation

### 2.2 Product Management API

**Goal:** Complete product catalog operations

**Status:** Complete — full product CRUD with S3 storage adapter, presigned URLs, inventory management.

**Deliverables:**

- [x] `POST /api/v1/products` - Create product
- [x] `GET /api/v1/products/:id` - Get product
- [x] `PUT /api/v1/products/:id` - Update product
- [x] `DELETE /api/v1/products/:id` - Soft delete
- [x] `GET /api/v1/stores/:storeId/products` - List store products
- [x] **S3/MinIO Storage Adapter** for `@ecomsaas/infrastructure` (file uploads, presigned URLs)
- [x] Image upload integration (using Storage adapter)
- [x] Inventory management
- [x] Tests and documentation

### 2.3 User & Vendor Management

**Goal:** User profile and vendor operations

**Status:** Complete — user self-service, vendor CRUD with IDOR fix on GET /vendors/:id.

**Deliverables:**

- [x] `GET /api/v1/users/me` - Current user profile
- [x] `PUT /api/v1/users/me` - Update profile
- [x] `POST /api/v1/vendors` - Become vendor
- [x] `GET /api/v1/vendors/:id` - Get vendor (ownership enforced)
- [x] `PUT /api/v1/vendors/:id` - Update vendor
- [ ] Vendor verification flow (deferred — requires email/document verification infrastructure)
- [x] Tests and documentation

### 2.4 Search & Filtering

**Goal:** Product and store search functionality

**Status:** Complete — search via query params on existing list endpoints using PostgreSQL ilike + exact count pagination.

**Deliverables:**

- [x] `GET /api/v1/stores?q=...&storeType=...&sortBy=...&offset=...&limit=...`
- [x] `GET /api/v1/products?q=...&storeId=...&categoryId=...&availability=...&minPrice=...&maxPrice=...`
- [x] Filtering by store type, category, price range, availability
- [x] Sorting options (name, price, createdAt; asc/desc)
- [x] Pagination with exact total count (`{ count: 'exact' }`)
- [x] PostgreSQL `ilike` for text search via Supabase PostgREST
- [x] Tests (92 unit, 54 e2e)

**Completion Criteria:**

- All core CRUD operations working
- Comprehensive tests
- Swagger docs complete
- Search functional

---

## Phase 3: Frontend Implementation (Week 9-10) ✅

**Status:** Complete — Supabase SSR auth, API clients, login/register pages, protected routes, and shared UI wiring delivered across both apps.

> **Note:** Next.js shells were scaffolded in Phase 0.4. This phase adds Supabase auth, API integration, layouts, and routing. Moved after core backend so frontends have real endpoints to consume.

### 3.1 Frontend Auth & API Integration

**Goal:** Setup API communication from frontends

**Deliverables:**

- [x] HTTP client implementation (custom `api` client in each app — lightweight fetch wrapper; shared-package adapter deferred)
- [x] Auth token injection (Bearer token from Supabase session)
- [x] Error handling (`ApiError` class with status/message)
- [ ] Retry logic _(deferred — TanStack Query handles retries at query level)_
- [x] TanStack Query setup for data fetching (`QueryProvider` in layout)
- [x] Example API call from frontend (home pages fetch session/user)

**Example (actual):**

```typescript
// clients/vendor/src/lib/api-client.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const supabase = createBrowserClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;
  // ... fetch with error handling
}
```

### 3.2 Authentication UI

**Goal:** Login and registration flows for both apps

**Deliverables:**

- [x] Login page (both apps)
- [x] Registration page (both apps — vendor includes `businessName` field)
- [x] Password reset flow (forgot-password + reset-password pages, both apps)
- [x] Protected route wrapper (Next.js middleware + server-side session check)
- [x] Auth state management (Supabase SSR — server/browser clients, no Zustand needed)
- [x] Redirect logic after auth (vendor → dashboard, storefront → home)

**Completion Criteria:**

- Both apps run locally (different ports)
- Can register and login
- Protected pages require auth
- Can call API successfully

---

## Phase 4: Vendor App Development (Week 11-12) ✅

**Status:** Complete — vendor onboarding, dashboard, product CRUD, and store settings. Deferred items: Stripe Connect, image upload, charts with real data.

### 4.1 Vendor Registration Flow

**Goal:** Complete vendor onboarding

**Status:** Complete — 2-step onboarding wizard with defensive profile creation for pre-trigger accounts.

**Deliverables:**

- [x] Multi-step registration form (2-step: store info → business details)
- [x] Business information collection (store type, description)
- [x] Store creation wizard (name, slug, description, type)
- [ ] Stripe Connect onboarding _(deferred to payment integration phase)_
- [x] Email verification (Supabase Auth built-in)
- [x] Redirect to dashboard on success

### 4.2 Store Dashboard

**Goal:** Vendor home page with overview

**Status:** Complete — dashboard shell with sidebar, topbar, stats cards, and store info.

**Deliverables:**

- [x] Store statistics (orders, revenue, products) — placeholder data
- [ ] Recent orders list _(deferred to order system phase)_
- [x] Quick actions (add product, etc.)
- [x] Store status indicator
- [ ] Charts (revenue over time) _(deferred — needs real order data)_

### 4.3 Product Management UI

**Goal:** Full product CRUD in vendor app

**Status:** Complete — unified ProductForm component for create/edit, listing table, delete action.

**Deliverables:**

- [x] Product list page (table with availability badges, formatted prices)
- [x] Add product form (unified ProductForm component)
- [x] Edit product page (shared ProductForm with pre-populated data)
- [x] Delete product confirmation
- [ ] Image upload interface _(deferred — needs S3 wiring end-to-end)_
- [ ] Inventory management UI _(deferred)_
- [ ] Product variants _(future)_

### 4.4 Store Settings

**Goal:** Store configuration interface

**Status:** Complete — tabbed settings page (General, Contact, Address).

**Deliverables:**

- [x] Store information editor (name, slug, description, type)
- [ ] Branding settings (logo, colors) _(deferred — needs asset upload)_
- [x] Domain/slug management (display, not editable yet)
- [ ] Notification preferences _(deferred)_
- [ ] Integration settings (Stripe, etc.) _(deferred)_

**Completion Criteria:**

- ✅ Vendor can fully manage store
- ✅ All forms validated
- ✅ Good UX (loading states, toast feedback, errors)
- ⬜ Mobile responsive (basic layout works, polish deferred)

---

## Phase 5: Marketplace Development (Week 13-14) ✅

**Status:** Complete — marketplace storefront with store pages, product detail, and multi-vendor shopping cart.

### 5.1 Marketplace Home Page ✅

**Goal:** Storefront discovery and browsing

**Status:** Complete — featured stores, store listings, search, category filters, responsive layout.

**Deliverables:**

- [x] Featured stores carousel
- [x] Store listings with filters
- [x] Search bar
- [x] Category navigation
- [x] Responsive design
- [ ] SEO optimization (deferred to Phase 10)

### 5.2 Individual Store View ✅

**Goal:** Render vendor store pages

**Status:** Complete — store page with branding, product grid, store info. Subdomain routing deferred.

**Deliverables:**

- [x] Store page with branding
- [x] Product grid/list
- [x] Store information section
- [x] Search within store
- [ ] Subdomain routing (deferred)
- [ ] SSG/ISR for performance (deferred to Phase 10)

### 5.3 Product Detail Pages ✅

**Goal:** Rich product presentation

**Status:** Complete — product info, pricing, add-to-cart, variant selection.

**Deliverables:**

- [x] Product information
- [x] Price and availability
- [x] Add to cart button
- [x] Vendor information
- [x] Basic meta tags
- [ ] Image gallery (deferred — uses placeholder)
- [ ] Related products (deferred)

### 5.4 Shopping Cart ✅

**Goal:** Multi-vendor cart implementation

**Status:** Complete — Zustand cart with multi-vendor grouping, localStorage persistence, quantity controls.

**Deliverables:**

- [x] Cart state management (Zustand)
- [x] Add/remove items
- [x] Quantity updates
- [x] Cart grouping by vendor
- [x] Cart persistence (localStorage)
- [x] Cart preview (sidebar)
- [x] Empty cart state

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

### 6.1 Checkout Flow ✅

**Goal:** Complete checkout implementation

**Status:** Complete — 3-step checkout (Review → Shipping → Payment), multi-vendor order splitting, Stripe PaymentElement.

**Deliverables:**

- [x] Checkout page (3-step flow)
- [x] Shipping information form
- [x] Payment method selection (Stripe Elements)
- [x] Order summary
- [x] Multi-vendor order splitting
- [x] Loading and error states
- [x] Order confirmation page (handles Stripe redirect)

### 6.2 Stripe Payment Integration ✅

**Goal:** Payment processing with Stripe

**Status:** Complete — PaymentIntent per vendor, webhook handling with idempotency, signature verification. Stripe Connect (platform fees) deferred.

**Deliverables:**

- [x] Payment Intent creation (split per vendor)
- [x] Payment confirmation (Stripe Elements)
- [x] Webhook handling (payment_intent.succeeded, payment_intent.payment_failed)
- [x] Idempotent ConfirmOrder use case
- [x] Tests with Stripe test mode
- [ ] Stripe Connect setup for vendors (deferred)
- [ ] Platform fee calculation (deferred)
- [ ] Refund capability (deferred)

### 6.3 Order Management API ✅

**Goal:** Order CRUD and status management

**Status:** Complete — atomic order persistence, domain state machine, RLS hardening, vendor access control. 4 rounds of security review applied.

**Deliverables:**

- [x] `POST /api/v1/stores/:storeId/orders` — Place order
- [x] `GET /api/v1/orders/:id` — Get order detail
- [x] `GET /api/v1/orders` — List customer orders
- [x] `GET /api/v1/stores/:storeId/orders` — Vendor store orders
- [x] `PUT /api/v1/orders/:id/status` — Update status (vendor)
- [x] Order state machine (domain VALID_TRANSITIONS + DB trigger enforcement)
- [x] Atomic order save RPC with sequence-based reference IDs
- [x] Security hardening: RLS, vendor update trigger, RPC lockdown
- [ ] Email notifications (deferred to Phase 7 — background jobs)

### 6.4 Order Management UI ✅

**Goal:** Order views for customers and vendors

**Status:** Complete — vendor-side and customer-side order management shipped.

**Deliverables:**

**Customer Side (Marketplace):**

- [x] Order history page — `/orders` with store name, status badges, total
- [x] Order detail page — `/orders/:id` with items table, totals, shipping info
- [x] Order tracking — status timeline component showing order progression
- [x] Download invoice — print-friendly invoice page with `@media print` CSS

**Vendor Side (Vendor App):**

- [x] Orders list (filterable by status) — status pill filter, table with customer join
- [x] Order detail page — items table, totals breakdown, payment/fulfillment/customer info
- [x] Update order status action — server action with DB trigger enforcement, shipping form with tracking
- [x] Dashboard stats — live order count + revenue
- [x] Sidebar navigation — Orders nav item
- [x] Print packing slip — print-friendly packing slip page with item checklist (no prices)
- [ ] Order analytics (deferred)

**Completion Criteria:**

- End-to-end order flow working
- Payments processing correctly
- Vendors receive payouts
- Customers receive confirmations
- All edge cases handled

---

## Phase 7: Background Jobs, Scalability & Code Quality (Week 17-18)

### 7.0 Package Audit & Vulnerability Remediation ✅

**Goal:** Resolve all critical/high dependency vulnerabilities, update packages to latest stable.

**Status:** Complete — 47 → 0 vulnerabilities. All packages updated within semver ranges.

**Deliverables:**

- [x] Run `pnpm audit` — found 47 vulns (2 critical, 23 high, 22 moderate)
- [x] `pnpm update --recursive` — updated all packages within semver ranges (47 → 8 vulns)
- [x] Add `vite@7.3.2` as explicit root devDependency — fixes 3 high + 1 moderate vite vulns
- [x] Add `pnpm.overrides` for `vite` and `file-type` — forces patched versions in transitive deps
- [x] Verify: `pnpm build` (10/10), `pnpm test`, `pnpm lint` (16/16), `pnpm type-check` (15/15) pass
- [x] Zero critical/high/moderate vulnerabilities in `pnpm audit`

**Notable updates:**

- NestJS ecosystem: 11.1.14 → 11.1.18 (fixes `@nestjs/core` injection vuln GHSA-36xv-jgw5-4q75)
- React: 19.2.4 → 19.2.5
- Supabase: 2.100.0 → 2.103.0
- Turbo: 2.7.5 → 2.9.6
- Vitest: 4.0.18 → 4.1.4
- @typescript-eslint: 8.53.1 → 8.58.1
- axios (transitive via @infisical/sdk): patched via update (SSRF + header injection)
- minimatch (transitive via eslint): patched via update (ReDoS)
- rollup (transitive via unplugin-swc): patched via update (path traversal)

**Major version bumps deferred (documented):**

- ESLint 9 → 10 (breaking config format changes)
- Next.js 15 → 16 (breaking — `next lint` removal, API changes)
- TypeScript 5 → 6 (breaking — new strictness checks)
- Storybook 8 → 10 (major overhaul, vite peer dep mismatch)
- Pino 9 → 10 (breaking API changes)

**Dependencies:** None

### 7.1 Code Quality Review & Standards Compliance

**Goal:** Address Clean Architecture drift, SOLID/DRY violations, and scalability impediments identified during Phase 6 review.

**Status:** Complete — all 7 findings resolved. OwnershipVerifier extraction, payment architecture hardening (provider-neutral model, durable webhook idempotency, atomic stock reservation, amount verification), security hardening (ConfigService, body limits, graceful shutdown), payment provider abstraction (web3 prep), shared `@ecomsaas/api-client` package, onboarding API routing, customer name enrichment, storefront `<img>` → `<Image>` migration.

**Deliverables:**

**High Priority:**

- [x] Route vendor mutations through API instead of direct Supabase writes (onboarding/actions.ts rewritten to call API; products/orders/settings already routed in Phase 4/6)
- [x] Move Stripe webhook idempotency from process-local `Set<string>` to durable storage (`WebhookEventLog` port + Supabase adapter backed by `webhook_events` table with unique constraint)

**Medium Priority:**

- [x] Redesign Queue port interface from SQS-shaped to BullMQ-shaped (`JobQueue.enqueue(jobName, payload, opts)` + processor registration)
- [x] Add atomic stock reservation in PlaceOrder (`reserve_stock_batch` RPC with positive-quantity validation guard)

**Low Priority:**

- [x] Extract duplicated `api-client.ts` to shared package (`@ecomsaas/api-client` with `createApiClient()` factory)
- [x] Replace placeholder customer name in `enrichOrder` with profile lookup (UserRepository injection)
- [x] Address lint warnings (storefront `<img>` → `next/image`)

**Dependencies:** Phase 7.0

### 7.2 Redis + BullMQ Infrastructure + Docker Compose ✅

**Goal:** Replace in-memory queue/cache with production Redis/BullMQ adapters. Add Docker Compose for local development.

**Status:** Complete — RedisCache (ioredis), BullMQQueue adapters, Docker Compose with Redis, Bull Board admin UI with Basic Auth, health check with Redis status.

**Deliverables:**

- [x] Design new `JobQueue` port interface (enqueue, processor registration, typed job names, lifecycle hooks)
- [x] Implement BullMQ adapter for `JobQueue` port (retry/backoff, delayed jobs, single-worker dispatch map)
- [x] Implement Redis cache adapter for existing `Cache` interface (ioredis, key namespacing, safe `clear`)
- [x] `docker-compose.yml` with Redis service
- [x] Mount Bull Board at `/admin/queues` behind HTTP Basic Auth (disabled in production without credentials)
- [x] Redis connection config via secrets/env (REDIS_URL or REDIS_HOST/PORT, graceful in-memory fallback)
- [x] Health check endpoints for Redis connectivity
- [x] Fix `follow-redirects` vulnerability via pnpm override (>=1.16.0)

**Dependencies:** Phase 7.1 (queue port redesign)

### 7.3 Email Infrastructure & Notifications

**Goal:** Add email sending capability. Define port, implement adapter, create templates, wire to order events.

**Status:** Complete ✅

**Deliverables:**

- [x] `EmailSender` interface in `packages/application/src/ports/`
- [x] Production adapter (Resend) + dev adapter (ConsoleEmailSender)
- [x] HTML email templates: order confirmation, status update, base layout
- [x] Enqueue email jobs from API use cases (order placed, status changed)
- [x] Best-effort per-process deduplication in job handlers (skip if already sent within the same API instance)
- [ ] Durable cross-instance idempotency store (for example Redis-backed deduplication)

**Dependencies:** Phase 7.2

### 7.4 Background Worker & Scheduled Jobs

**Goal:** Create the worker application and scheduled job infrastructure, then implement the reconciliation, alerting, and cleanup job logic.

**Status:** In Progress — standalone Node.js worker, BullMQ consumers, cron registration, and graceful shutdown are implemented. The three scheduled processors are still stubs and need real business logic before this phase can be considered complete.

**Deliverables:**

- [x] Create `backends/worker/` — lightweight Node.js process (no NestJS, standalone)
- [x] Connect to same Redis and share `@ecomsaas/infrastructure` (application-layer sharing deferred to Phase 8+)
- [x] Register cron schedules for payment reconciliation (hourly), low-stock alerts (daily), and stale order cleanup (daily)
- [x] Implement BullMQ worker wiring with structured logging, retry/backoff, and graceful shutdown
- [x] Add the worker to Turborepo and the current Redis-focused Docker Compose stack
- [ ] Implement payment reconciliation processor logic
- [ ] Implement low-stock alert processor logic
- [ ] Implement stale order cleanup processor logic

**Architecture:**

```
API (producer) → Redis/BullMQ → Worker (consumer)
Worker (scheduler) → Redis/BullMQ → Worker (consumer)
```

**Dependencies:** Phase 7.2, Phase 7.3

**Completion Criteria:**

- Zero audit vulnerabilities (7.0)
- Clean Architecture drift resolved; all mutations through API (7.1)
- Redis + BullMQ operational, Bull Board accessible (7.2)
- Order emails sending end-to-end (7.3)
- Worker running scheduled jobs with real business behavior rather than stub handlers (7.4)

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
