# EcomSaaS

A modern, scalable multi-tenant e-commerce platform enabling vendors to create and manage online stores with Stripe payments, clean architecture, and a pluggable payment gateway designed for future crypto integration.

> **Portfolio Project**: This project demonstrates modern full-stack development practices, clean architecture, monorepo organization, and integration of production technologies including TypeScript, NestJS, Next.js, Supabase, and Stripe.

> **🤖 AI-Assisted Development**: This project leverages generative AI (GitHub Copilot, Claude) as development tools for code generation and documentation. All AI-generated code is reviewed, refined, tested, and supervised by the developer. Architectural decisions, system design, and implementation strategies are human-driven. This approach demonstrates effective collaboration with modern AI development tools while maintaining code quality and understanding.

> **⚠️ Security Notice**: This is a portfolio/learning project with security features being implemented progressively. It is not yet production-ready. Deep security hardening, compliance measures, and comprehensive penetration testing will be added in later development phases.

## 📚 Documentation

- **[Architecture Overview](docs/ARCHITECTURE.md)** - System design, technology stack, and architectural decisions
- **[Implementation Plan](docs/IMPLEMENTATION_PLAN.md)** - Detailed phased development roadmap
- **[Technical Decisions](docs/DECISIONS.md)** - Quick reference for all key technical decisions
- **[Stripe Setup](docs/STRIPE_SETUP.md)** - Stripe integration, webhook setup, and local testing
- **[Commit Guide](docs/COMMIT_GUIDE.md)** - Commit message conventions and guidelines
- **[TypeScript Config Examples](docs/TSCONFIG_EXAMPLES.md)** - Package configuration patterns
- **[Security Policy](SECURITY.md)** - Vulnerability reporting and security practices

## ✨ Key Features

- **Multi-Tenant Stores**: Vendors create branded stores accessible via subdomains
- **Marketplace**: Central discovery platform for all vendor stores
- **Multi-Vendor Cart**: Customers shop from multiple stores in one transaction
- **Stripe Payments**: Payment processing with provider-neutral gateway abstraction
- **Clean Architecture**: Shared domain and application layers with ports & adapters
- **Security Hardening**: Auth guards, ownership verification, body size limits, config validation
- **Blockchain Ready**: Foundry scaffold and pluggable `PaymentGateway` port for future crypto payments (Polygon)

## 📋 What's Implemented

> See [docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md) for the full roadmap with deliverable checklists.

### ✅ Complete

| Phase                     | Description                                         | Highlights                                                                                                                                                                                                                     |
| ------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **0 — Foundation**        | Shared packages, domain models, infrastructure      | DDD entities (Store, Product, Order, Subscription), value objects (Money, Address), 280+ domain tests, shared validation (Zod), infrastructure adapters (cache, queue, storage, logger), shared UI library (shadcn + Tailwind) |
| **1 — API Foundation**    | NestJS API with Supabase auth & database            | Supabase JWT auth, RLS propagation, repository pattern, stores slug endpoint, e2e test framework                                                                                                                               |
| **2 — Core Backend**      | Full CRUD APIs for stores, products, users, vendors | Store management, product catalog, user/vendor management, search & filtering, S3 storage adapter, security hardening (CORS, Helmet, rate limiting)                                                                            |
| **3 — Frontend Auth**     | Supabase SSR auth for both frontends                | Login/register (vendor + storefront), session middleware, API client with token injection, shared UI components wired in                                                                                                       |
| **4 — Vendor Dashboard**  | Full vendor management experience                   | 2-step onboarding wizard, dashboard with stats, product CRUD (create/edit/delete), store settings (general/contact/address), shared TagInput component                                                                         |
| **5 — Marketplace**       | Storefront discovery and shopping                   | Store listing & detail pages, product catalog with search, product detail, multi-vendor cart with Zustand                                                                                                                      |
| **6 — Orders & Payments** | Checkout flow with Stripe                           | Multi-step checkout (review → shipping → payment), Stripe PaymentIntent integration, order placement & confirmation via webhooks, order management API, atomic order persistence                                               |
| **7.0 — Package Audit**   | Dependency and build health                         | Audit all workspace packages, fix version mismatches, ensure clean builds                                                                                                                                                      |
| **7.1 — Code Quality**    | Standards compliance and hardening                  | OwnershipVerifier extraction, payment provider abstraction (web3 prep), durable webhook idempotency, atomic stock reservation, shared `@ecomsaas/api-client`, onboarding API routing, security hardening, config hygiene       |
| **7.2 — Redis + BullMQ**  | Production queue/cache infrastructure               | RedisCache (ioredis) + BullMQQueue adapters, Docker Compose with Redis, Bull Board admin UI with Basic Auth, health check with Redis status, graceful in-memory fallback                                                       |

### 🔜 Up Next

| Phase                         | Description                                                      |
| ----------------------------- | ---------------------------------------------------------------- |
| **7.3 — Email Notifications** | Email port, adapter, templates, order event wiring               |
| **7.4 — Background Worker**   | Worker process, cron jobs (reconciliation, alerts, cleanup)      |
| **8 — Blockchain**            | Smart contracts, crypto payments, fundraising, rewards (Polygon) |

## 🏗️ Architecture

This monorepo contains multiple applications and shared packages following clean architecture principles.

### Workspace Structure

```
ecomsaas/
├── backends/          # Backend services (APIs, microservices)
├── clients/           # Frontend applications (web, mobile, admin)
├── packages/          # Shared TypeScript packages
│   ├── domain/        # Core entities, value objects, enums
│   ├── contracts/     # DTOs, API protocol types
│   ├── application/   # Use cases and port interfaces
│   ├── infrastructure/# Shared infra adapters (cache, queue, storage, logger)
│   ├── validation/    # Shared Zod schemas
│   ├── api-client/    # Shared HTTP client factory
│   └── ui/            # Shared UI components (shadcn + Tailwind)
├── blockchain/        # Smart contracts and blockchain integrations
├── infra/            # Infrastructure as Code (Terraform, K8s manifests)
├── docs/             # Documentation
└── scripts/          # Build and deployment scripts
```

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v24.10.0 (see `.nvmrc`)
- **pnpm**: 10.24.0+
- **Supabase CLI**: For local database or migration management — [install guide](https://supabase.com/docs/guides/cli/getting-started)
- **Stripe CLI** _(optional)_: For testing webhooks locally — `brew install stripe/stripe-cli/stripe`
- **Foundry** _(optional)_: For smart contract development — [install guide](https://book.getfoundry.sh/getting-started/installation)
- **Docker** _(optional)_: For running Redis locally — [install guide](https://docs.docker.com/get-docker/)

### Installation

```bash
# Use the correct Node version
nvm use

# Install dependencies
pnpm install

# Install Foundry dependencies (only needed for smart contract work)
cd blockchain/contracts && forge install && cd ../..

# Build all packages
pnpm build
```

### Local Infrastructure (Optional)

Start Redis for production-grade cache and queue (falls back to in-memory without it):

```bash
docker compose up -d
```

### Environment Setup

Copy each `.env.example` and fill in your values:

```bash
# API server
cp backends/api/.env.example backends/api/.env

# Storefront client
cp clients/storefront/.env.example clients/storefront/.env.local

# Vendor dashboard (optional — only if working on vendor features)
cp clients/vendor/.env.example clients/vendor/.env.local
```

**Where to get the values:**

| Variable                                                         | Source                                                                                                |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Supabase project → Settings → API                                                                     |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`      | Same as above (public-safe keys)                                                                      |
| `STRIPE_SECRET_KEY`                                              | [Stripe Dashboard → API keys](https://dashboard.stripe.com/test/apikeys) — Secret key (`sk_test_...`) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`                             | Same page — Publishable key (`pk_test_...`)                                                           |
| `STRIPE_WEBHOOK_SECRET`                                          | Output of `stripe listen` CLI command (`whsec_...`)                                                   |

### Database Setup

```bash
# Apply all migrations to your Supabase database
npx supabase db push
```

### Running Services

```bash
# Start everything (API + storefront + vendor dashboard)
pnpm dev
```

Or run services individually:

```bash
pnpm --filter @ecomsaas/api dev        # API        → http://localhost:3000
pnpm --filter @ecomsaas/storefront dev # Storefront → http://localhost:3001
pnpm --filter @ecomsaas/vendor dev     # Vendor     → http://localhost:3002
```

### Stripe Webhooks (Local Dev)

To receive payment confirmations locally, run in a separate terminal:

```bash
stripe listen --forward-to localhost:3000/api/v1/webhooks/stripe
```

Copy the `whsec_...` secret it prints into `backends/api/.env` as `STRIPE_WEBHOOK_SECRET`.

### Verify Everything Works

```bash
# Health check
curl http://localhost:3000/health

# Run all checks
pnpm type-check && pnpm lint && pnpm test
```

## 📦 Development

### Common Commands

```bash
# Run all apps in development mode
pnpm dev

# Build all packages and apps
pnpm build

# Lint all code
pnpm lint

# Fix linting issues
pnpm lint:fix

# Format code with Prettier
pnpm format

# Check formatting
pnpm format:check

# Run tests
pnpm test
```

### Working with Workspaces

```bash
# Add a dependency to a specific workspace
pnpm --filter @ecomsaas/api add stripe

# Run a command in a specific workspace
pnpm --filter @ecomsaas/storefront dev

# Add a dev dependency to the root
pnpm add -D -w <package-name>
```

## 🔧 Technology Stack

- **Build System**: Turborepo for monorepo task orchestration
- **Package Manager**: pnpm with workspaces
- **Language**: TypeScript (with per-package configuration strategy)
- **Code Quality**: ESLint, Prettier, Husky, lint-staged
- **Commits**: Conventional Commits with commitlint

### TypeScript Strategy

The root `tsconfig.json` provides minimal base settings. Each package extends it and overrides for its needs:

- **Shared packages**: `module: "ESNext"`, `moduleResolution: "bundler"` (ESM-only)
- **Backend services**: Same ESM config with NestJS SWC compiler
- **Web applications**: `module: "ESNext"`, `moduleResolution: "bundler"` with Next.js
- **All packages**: Built with tsup (ESM output, DTS generation, sourcemaps)

See [docs/TSCONFIG_EXAMPLES.md](docs/TSCONFIG_EXAMPLES.md) for detailed examples.

## 📝 Contributing

### Commit Convention

This project uses [Conventional Commits](https://www.conventionalcommits.org/) with **required scopes**:

```bash
feat(api): add new payment gateway
fix(web): resolve checkout cart issue
docs(readme): update API documentation
chore(deps): upgrade dependencies
```

**Scopes are required** to help organize changes in this monorepo. See the complete guide: [docs/COMMIT_GUIDE.md](docs/COMMIT_GUIDE.md)

### Git Hooks

- **pre-commit**: Runs lint-staged (ESLint + Prettier on staged files)
- **commit-msg**: Validates commit messages follow conventional commits with scopes

## 📄 License

ISC License - This project is open source for learning and portfolio purposes.

The ISC license allows anyone to use, modify, and distribute this code freely, including for commercial purposes, with minimal restrictions. As the original author, I retain the right to use this codebase for any purpose, including private commercial ventures.

See the LICENSE file for full details.
