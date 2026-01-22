# Implementation Plan

> **Status:** Planning Phase  
> **Start Date:** January 22, 2026  
> **Estimated Duration:** 12-16 weeks (part-time)

This document outlines the phased implementation plan for the EcomSaaS platform, breaking down the work into manageable milestones with clear deliverables.

## Implementation Principles

1. **Incremental Delivery:** Each phase produces working software
2. **Test Early:** Tests added from Phase 1 onward
3. **Documentation as Code:** Keep docs updated with implementation
4. **Clean Architecture:** Maintain layer separation throughout
5. **Vertical Slices:** Complete features end-to-end before moving on

## Phase 0: Foundation (Week 1-2)

### 0.1 Shared Type System

**Goal:** Establish TypeScript type definitions shared across all apps

**Deliverables:**

- [ ] Create `packages/types/`
- [ ] Define base types: `User`, `Vendor`, `Store`, `Product`, `Order`
- [ ] Setup package exports
- [ ] Configure TypeScript project references

**Files:**

```
packages/types/
├── src/
│   ├── user.types.ts
│   ├── vendor.types.ts
│   ├── store.types.ts
│   ├── product.types.ts
│   ├── order.types.ts
│   ├── common.types.ts
│   └── index.ts
├── package.json
└── tsconfig.json
```

### 0.2 Shared Domain Layer

**Goal:** Implement core business entities with business logic

**Deliverables:**

- [ ] Create `packages/domain/`
- [ ] Implement domain entities (User, Store, Product, Order)
- [ ] Add business validation rules
- [ ] Add unit tests (Vitest)
- [ ] Document domain model

**Structure:**

```typescript
// Example: packages/domain/src/entities/Store.ts
export class Store {
  constructor(
    public readonly id: string,
    public readonly vendorId: string,
    public slug: string,
    public name: string
    // ... other properties
  ) {
    this.validate();
  }

  validate(): void {
    if (this.slug.length < 3) {
      throw new Error('Store slug must be at least 3 characters');
    }
    // More validation...
  }

  updateName(newName: string): Store {
    // Business logic for name updates
    return new Store(this.id, this.vendorId, this.slug, newName);
  }
}
```

**Dependencies:** Phase 0.1 (types)

### 0.3 Shared Application Layer

**Goal:** Implement reusable use cases (business orchestration)

**Deliverables:**

- [ ] Create `packages/application/`
- [ ] Define repository interfaces (ports)
- [ ] Implement use cases: `GetStore`, `CreateProduct`, `PlaceOrder`
- [ ] Add unit tests
- [ ] Document use cases

**Structure:**

```typescript
// Example: packages/application/src/use-cases/GetStore.ts
export interface StoreRepository {
  findBySlug(slug: string): Promise<Store | null>;
}

export class GetStoreUseCase {
  constructor(private storeRepo: StoreRepository) {}

  async execute(slug: string): Promise<Store> {
    const store = await this.storeRepo.findBySlug(slug);
    if (!store) {
      throw new Error('Store not found');
    }
    return store;
  }
}
```

**Dependencies:** Phase 0.2 (domain)

### 0.4 Shared Infrastructure Utilities

**Goal:** Create reusable infrastructure tools

**Deliverables:**

- [ ] `packages/infrastructure/logger/` - Logging utility (Winston/Pino)
- [ ] `packages/infrastructure/secrets/` - Secret manager wrapper (environment-aware)
- [ ] `packages/infrastructure/http/` - HTTP client (with auth, retry, error handling)
- [ ] `packages/infrastructure/cache/` - Redis caching wrapper
- [ ] `packages/infrastructure/queue/` - BullMQ queue wrapper (producer & consumer)
- [ ] `packages/infrastructure/database/` - Supabase migration wrapper
- [ ] `packages/infrastructure/storage/` - File storage wrapper (MinIO/S3/Supabase)
- [ ] `packages/infrastructure/tracing/` - Observability setup
- [ ] Add tests and documentation

**Logger Example:**

```typescript
// packages/infrastructure/logger/src/index.ts
export interface Logger {
  info(message: string, meta?: any): void;
  error(message: string, error?: Error, meta?: any): void;
  warn(message: string, meta?: any): void;
  debug(message: string, meta?: any): void;
}

export function createLogger(context: string): Logger {
  // Implementation with Pino or Winston
}
```

**Secrets Manager Example:**

```typescript
// packages/infrastructure/secrets/src/index.ts
export interface SecretsManager {
  get(key: string): Promise<string>;
  set(key: string, value: string): Promise<void>;
}

export function createSecretsManager(env: string): SecretsManager {
  // Implementation for different environments
  // - Local: .env files
  // - Cloud: GCP Secret Manager / AWS Secrets Manager
}
```

### 0.5 Shared Validation Layer

**Goal:** Centralized validation schemas

**Deliverables:**

- [ ] Create `packages/validation/`
- [ ] Zod schemas for all entities
- [ ] Validation helpers
- [ ] Tests

**Example:**

```typescript
// packages/validation/src/schemas/store.schema.ts
import { z } from 'zod';

export const storeSchema = z.object({
  slug: z
    .string()
    .min(3)
    .max(50)
    .regex(/^[a-z0-9-]+$/),
  name: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
  // ... more fields
});

export type StoreInput = z.infer<typeof storeSchema>;
```

**Dependencies:** Phase 0.1 (types)

### 0.6 Shared UI Component Library

**Goal:** Reusable React components for frontends

**Deliverables:**

- [ ] Create `packages/ui/`
- [ ] Setup Tailwind + shadcn/ui
- [ ] Implement base components: Button, Input, Card, Modal
- [ ] Storybook for component documentation
- [ ] Tests (React Testing Library)

**Structure:**

```
packages/ui/
├── src/
│   ├── components/
│   │   ├── Button/
│   │   ├── Input/
│   │   ├── Card/
│   │   └── ...
│   ├── styles/
│   │   └── globals.css
│   └── index.ts
├── .storybook/
├── package.json
└── tsconfig.json
```

**Completion Criteria:**

- All phase 0 packages build successfully
- All tests passing
- Documentation complete
- Can be imported by other packages

---

## Phase 1: API Foundation (Week 3-4)

### 1.1 API Project Setup

**Goal:** Bootstrap NestJS API with basic structure

**Deliverables:**

- [ ] Create `backends/api/` with NestJS CLI
- [ ] Configure TypeScript (extends root tsconfig)
- [ ] Setup project structure (modules, controllers, services)
- [ ] Configure environment variables (dotenv)
- [ ] Add logger integration (from packages)
- [ ] Add health check endpoint: `GET /health`
- [ ] Configure Swagger/OpenAPI
- [ ] Add basic error handling
- [ ] Add request logging middleware

**Structure:**

```
backends/api/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── modules/
│   │   ├── health/
│   │   └── users/
│   ├── common/
│   │   ├── filters/
│   │   ├── interceptors/
│   │   └── pipes/
│   └── config/
├── test/
├── package.json
└── tsconfig.json
```

### 1.2 Database Setup

**Goal:** Connect to Supabase and setup migrations

**Deliverables:**

- [ ] Supabase project creation
- [ ] Database schema design (initial)
- [ ] Migration system setup (Supabase CLI or Prisma)
- [ ] Seed data script for development
- [ ] Database connection in API
- [ ] Repository pattern implementation

**Initial Schema:**

```sql
-- Users (managed by Supabase Auth)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('vendor', 'customer')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vendors
CREATE TABLE vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  business_name TEXT NOT NULL,
  stripe_connect_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stores
CREATE TABLE stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products (basic for now)
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  inventory INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 1.3 Authentication Integration

**Goal:** Integrate Supabase Auth with NestJS

**Deliverables:**

- [ ] Supabase client setup in API
- [ ] JWT validation middleware/guard
- [ ] User extraction from token
- [ ] Role-based guards (vendor, customer)
- [ ] Auth module and strategy
- [ ] Tests for auth guards

**Implementation:**

```typescript
// src/common/guards/supabase-auth.guard.ts
@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractToken(request);
    const { data, error } = await supabase.auth.getUser(token);
    if (error) throw new UnauthorizedException();
    request.user = data.user;
    return true;
  }
}
```

### 1.4 First API Endpoint (Test)

**Goal:** Implement a simple test endpoint with full stack

**Deliverables:**

- [ ] `GET /api/v1/stores/:slug` endpoint
- [ ] Uses GetStoreUseCase from application layer
- [ ] Repository implementation (Supabase)
- [ ] DTO validation (Zod)
- [ ] Unit tests
- [ ] Integration tests
- [ ] Swagger documentation

**Example Flow:**

```
Request → Controller → UseCase → Repository → Database
        ← DTO      ← Domain   ← Entity    ←
```

### 1.5 API Testing Framework

**Goal:** Establish comprehensive testing strategy

**Deliverables:**

- [ ] Unit test setup (Vitest or Jest)
- [ ] Integration test setup (supertest)
- [ ] Test database strategy (test container or separate DB)
- [ ] Example tests for all layers
- [ ] CI integration (tests run on commit)

**Test Structure:**

```
backends/api/test/
├── unit/
│   ├── use-cases/
│   └── repositories/
├── integration/
│   └── api/
├── fixtures/
└── helpers/
```

**Completion Criteria:**

- API runs locally on port 3000
- Health check returns 200
- Test endpoint works end-to-end
- All tests passing
- Swagger UI accessible

---

## Phase 2: Frontend Foundations (Week 5-6)

### 2.1 Vendor App Setup

**Goal:** Bootstrap Next.js app for vendor management

**Deliverables:**

- [ ] Create `clients/vendor/` with Next.js 15 (App Router)
- [ ] Configure TypeScript
- [ ] Setup Tailwind CSS + shadcn/ui
- [ ] Import shared UI components
- [ ] Setup Supabase client (auth)
- [ ] Add environment configuration
- [ ] Create basic layout with navigation
- [ ] Home page with "Hello World"

**Structure:**

```
clients/vendor/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── (auth)/
│   │       ├── login/
│   │       └── register/
│   ├── components/
│   ├── lib/
│   │   ├── supabase.ts
│   │   └── api-client.ts
│   └── styles/
├── public/
├── package.json
└── tsconfig.json
```

### 2.2 Marketplace App Setup

**Goal:** Bootstrap Next.js app for marketplace and stores

**Deliverables:**

- [ ] Create `clients/marketplace/` with Next.js 15
- [ ] Configure TypeScript
- [ ] Setup Tailwind CSS + shadcn/ui
- [ ] Import shared UI components
- [ ] Setup Supabase client
- [ ] Subdomain extraction middleware
- [ ] Basic routing:
  - Marketplace home
  - Store view (subdomain-based)
- [ ] Home page with "Hello World"

**Subdomain Middleware:**

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host');
  const subdomain = extractSubdomain(hostname);

  if (subdomain && subdomain !== 'www') {
    // Rewrite to /store/[slug] route
    return NextResponse.rewrite(new URL(`/store/${subdomain}`, request.url));
  }

  return NextResponse.next();
}
```

### 2.3 HTTP Client & API Integration

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

### 2.4 Authentication UI

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

## Phase 3: CI/CD & Infrastructure (Week 7-8)

### 3.1 Docker Containerization

**Goal:** Dockerize all applications

**Deliverables:**

- [ ] Dockerfile for API
- [ ] Dockerfile for Vendor app
- [ ] Dockerfile for Marketplace app
- [ ] Docker Compose for local development
- [ ] Multi-stage builds for optimization
- [ ] .dockerignore files

**Docker Compose:**

```yaml
version: '3.8'

services:
  # API Service
  api:
    build: ./backends/api
    ports:
      - '3000:3000'
    env_file: .env.local
    depends_on:
      - redis
      - minio
    environment:
      - REDIS_URL=redis://redis:6379
      - MINIO_ENDPOINT=minio:9000

  # Vendor Frontend
  vendor:
    build: ./clients/vendor
    ports:
      - '3001:3000'
    env_file: .env.local

  # Marketplace Frontend
  marketplace:
    build: ./clients/marketplace
    ports:
      - '3002:3000'
    env_file: .env.local

  # Redis (Caching + Queue)
  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'
    volumes:
      - redis-data:/data

  # MinIO (S3-compatible local storage)
  minio:
    image: minio/minio:latest
    ports:
      - '9000:9000' # API
      - '9001:9001' # Console
    environment:
      - MINIO_ROOT_USER=minioadmin
      - MINIO_ROOT_PASSWORD=minioadmin
    volumes:
      - minio-data:/data
    command: server /data --console-address ':9001'

  # PostgreSQL (Optional - if not using Supabase cloud)
  # postgres:
  #   image: postgres:15-alpine
  #   ports:
  #     - '5432:5432'
  #   environment:
  #     - POSTGRES_DB=ecomsaas
  #     - POSTGRES_USER=postgres
  #     - POSTGRES_PASSWORD=postgres
  #   volumes:
  #     - postgres-data:/var/lib/postgresql/data

volumes:
  redis-data:
  minio-data:
  # postgres-data:
```

**Notes:**

- MinIO simulates S3/GCS locally for file uploads
- Redis serves both cache and message queue
- PostgreSQL commented out (using Supabase cloud for development)
- All services accessible from host machine

### 3.2 GitHub Actions CI Pipeline

**Goal:** Automated testing and building

**Deliverables:**

- [ ] Workflow for PR checks
- [ ] Lint all code
- [ ] Run all tests
- [ ] Build all apps
- [ ] Check for TypeScript errors
- [ ] Dependency caching
- [ ] Build Docker images
- [ ] Push to container registry

**Workflow:**

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
      - run: pnpm install
      - run: pnpm lint
      - run: pnpm test
      - run: pnpm build
```

### 3.3 Terraform Setup (GCP/AWS)

**Goal:** Infrastructure as Code for cloud deployment

**Deliverables:**

- [ ] Create `infra/terraform/`
- [ ] VPC and networking setup
- [ ] Container registry
- [ ] Kubernetes cluster (or Cloud Run)
- [ ] Load balancer configuration
- [ ] DNS configuration
- [ ] Secrets management
- [ ] Different environments (staging, production)

**Structure:**

```
infra/terraform/
├── modules/
│   ├── networking/
│   ├── compute/
│   └── storage/
├── environments/
│   ├── staging/
│   └── production/
└── main.tf
```

### 3.4 Preview Deployments

**Goal:** Automatic deployment for PRs

**Deliverables:**

- [ ] Preview environment per PR
- [ ] Deploy to staging on PR
- [ ] Comment with preview URL
- [ ] Auto-cleanup on PR close
- [ ] Environment isolation

**Completion Criteria:**

- Docker Compose runs entire stack locally
- CI pipeline green on all commits
- Can deploy to cloud staging environment
- Preview deployments working

---

## Phase 4: Core Backend Implementation (Week 9-10)

### 4.1 Store Management API

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

### 4.2 Product Management API

**Goal:** Complete product catalog operations

**Deliverables:**

- [ ] `POST /api/v1/products` - Create product
- [ ] `GET /api/v1/products/:id` - Get product
- [ ] `PUT /api/v1/products/:id` - Update product
- [ ] `DELETE /api/v1/products/:id` - Soft delete
- [ ] `GET /api/v1/stores/:storeId/products` - List store products
- [ ] Image upload integration (Supabase Storage)
- [ ] Inventory management
- [ ] Tests and documentation

### 4.3 User & Vendor Management

**Goal:** User profile and vendor operations

**Deliverables:**

- [ ] `GET /api/v1/users/me` - Current user profile
- [ ] `PUT /api/v1/users/me` - Update profile
- [ ] `POST /api/v1/vendors` - Become vendor
- [ ] `GET /api/v1/vendors/:id` - Get vendor
- [ ] `PUT /api/v1/vendors/:id` - Update vendor
- [ ] Vendor verification flow
- [ ] Tests and documentation

### 4.4 Search & Filtering

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

## Phase 5: Vendor App Development (Week 11-12)

### 5.1 Vendor Registration Flow

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

### 5.2 Store Dashboard

**Goal:** Vendor home page with overview

**Deliverables:**

- [ ] Store statistics (orders, revenue, products)
- [ ] Recent orders list
- [ ] Quick actions (add product, etc.)
- [ ] Store status indicator
- [ ] Charts (revenue over time)

### 5.3 Product Management UI

**Goal:** Full product CRUD in vendor app

**Deliverables:**

- [ ] Product list page
- [ ] Add product form (multi-step)
- [ ] Edit product page
- [ ] Delete product confirmation
- [ ] Image upload interface
- [ ] Inventory management UI
- [ ] Product variants (future)

### 5.4 Store Settings

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

## Phase 6: Marketplace Development (Week 13-14)

### 6.1 Marketplace Home Page

**Goal:** Storefront discovery and browsing

**Deliverables:**

- [ ] Featured stores carousel
- [ ] Store listings with filters
- [ ] Search bar
- [ ] Category navigation
- [ ] Responsive design
- [ ] SEO optimization

### 6.2 Individual Store View (Subdomain)

**Goal:** Render vendor stores on subdomains

**Deliverables:**

- [ ] Store page with branding
- [ ] Product grid/list
- [ ] Product detail page
- [ ] Store information section
- [ ] Search within store
- [ ] SSG/ISR for performance

**Example:** `acme-store.oursite.com`

### 6.3 Product Detail Pages

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

### 6.4 Shopping Cart

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

## Phase 7: Order & Payment System (Week 15-16)

### 7.1 Checkout Flow

**Goal:** Complete checkout implementation

**Deliverables:**

- [ ] Checkout page
- [ ] Shipping information form
- [ ] Payment method selection
- [ ] Order summary
- [ ] Multi-vendor order splitting
- [ ] Loading and error states
- [ ] Order confirmation page

### 7.2 Stripe Payment Integration

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

### 7.3 Order Management API

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

### 7.4 Order Management UI

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

## Phase 8: Background Jobs & Worker (Week 17)

### 8.1 Message Queue Setup

**Goal:** Setup BullMQ for async job processing

**Deliverables:**

- [ ] Redis setup (production)
- [ ] BullMQ configuration
- [ ] Job queue definitions
- [ ] Queue monitoring UI (Bull Board)

### 8.2 Background Worker App

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

### 8.3 Job Implementations

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

## Phase 9: Blockchain Integration (Week 18-20)

### 9.1 Smart Contract Development

**Goal:** Solidity contracts for fundraising and rewards

**Deliverables:**

- [ ] Create `blockchain/contracts/`
- [ ] Fundraising contract (ERC20 token issuance)
- [ ] Rewards contract (token distribution)
- [ ] Unit tests (Hardhat)
- [ ] Deploy to Polygon testnet (Mumbai)
- [ ] Contract verification

### 9.2 Web3 Integration (Frontend)

**Goal:** Connect wallets and interact with contracts

**Deliverables:**

- [ ] Wallet connection (MetaMask, WalletConnect)
- [ ] wagmi/viem setup
- [ ] Network switching (Polygon mainnet/testnet)
- [ ] Contract interaction hooks
- [ ] Transaction status handling
- [ ] UI components for Web3 features

### 9.3 Crypto Payment Feature

**Goal:** Accept crypto payments for products

**Deliverables:**

- [ ] Crypto payment option in checkout
- [ ] Price conversion (USD to crypto)
- [ ] Payment confirmation (on-chain)
- [ ] Webhook/listener for payment events
- [ ] Reconciliation with orders
- [ ] Vendor payout in crypto

### 9.4 Fundraising Feature

**Goal:** Vendors can raise funds via token issuance

**Deliverables:**

- [ ] Token creation UI (vendor app)
- [ ] Token sale parameters setup
- [ ] Investment flow (marketplace)
- [ ] Token distribution
- [ ] Investor dashboard
- [ ] Legal disclaimer (important!)

### 9.5 Rewards System

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

## Phase 10: MCP Server (Week 21)

### 10.1 MCP Server Setup

**Goal:** AI chat backend for vendor assistance

**Deliverables:**

- [ ] Create `backends/mcp/`
- [ ] MCP protocol implementation
- [ ] Connect to API (internal HTTP client)
- [ ] Authentication/authorization
- [ ] Rate limiting

### 10.2 Tools/Functions Implementation

**Goal:** Define available tools for AI

**Deliverables:**

- [ ] `getStoreInfo` tool
- [ ] `listProducts` tool
- [ ] `createProduct` tool
- [ ] `updateStoreSettings` tool
- [ ] `getOrderStats` tool
- [ ] JSON schema for all tools

### 10.3 Chat UI Integration

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

## Phase 11: Polish & Production Readiness (Week 22-24)

### 11.1 Security Hardening

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

### 11.2 Performance Optimization

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

### 11.3 Monitoring & Observability

**Goal:** Production monitoring setup

**Deliverables:**

- [ ] Application logs aggregation
- [ ] Error tracking (Sentry)
- [ ] Performance monitoring (APM)
- [ ] Uptime monitoring
- [ ] Alert configuration
- [ ] Dashboard creation
- [ ] Analytics integration

### 11.4 Documentation

**Goal:** Complete documentation

**Deliverables:**

- [ ] API documentation (OpenAPI)
- [ ] User guides (vendor and customer)
- [ ] Deployment runbook
- [ ] Troubleshooting guide
- [ ] Architecture diagrams
- [ ] Video demos/tutorials

### 11.5 Testing

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
2. Begin Phase 0.1 (Shared Types)
3. Setup project tracking (GitHub Projects/Issues)
4. Create branch strategy
5. Start coding!
