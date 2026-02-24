# Copilot Instructions — EcomSaaS Monorepo

## Project Overview

EcomSaaS is a multi-tenant e-commerce SaaS platform enabling vendors to create online stores with integrated blockchain features (crypto payments, fundraising). This is the monorepo root.

## Current Phase

**Phase 0.1** — Shared type system. Only two packages exist today:

- `packages/domain/` — entities, value objects, enums (implemented, builds clean)
- `packages/contracts/` — DTOs, API protocol types (implemented, builds clean)

Everything else in the monorepo structure is **planned but not yet created**. Do not generate code that imports from packages that don't exist yet (application, utils, ui, config, validation, infrastructure, backends, clients).

## Architecture

We follow **Clean Architecture** with strict dependency rules:

```
Domain (innermost) → Application → Infrastructure → Presentation (outermost)
```

- Inner layers NEVER depend on outer layers.
- Dependencies always point inward.
- Domain has zero external dependencies.

### Package Dependency Graph

```
@ecomsaas/domain        ← innermost, zero deps
@ecomsaas/contracts     ← depends on domain only
@ecomsaas/application   ← depends on domain (planned)
backends/api            ← depends on all shared packages (planned)
clients/*               ← depends on contracts + ui (planned)
```

### Monorepo Structure

```
packages/domain/        → Core entities, value objects, enums (zero deps)
packages/contracts/     → DTOs, API contracts, protocol types (depends on domain)
packages/application/   → Use cases, repository interfaces (planned)
packages/ui/            → Shared React UI components (planned)
packages/utils/         → Pure utility functions (planned)
packages/validation/    → Zod schemas (planned)
packages/config/        → Shared configuration (planned)
packages/infrastructure/→ Infra utilities: logger, cache, queue, etc. (planned)
backends/api/           → NestJS API service (planned)
clients/vendor/         → Next.js vendor dashboard (planned)
clients/marketplace/    → Next.js customer marketplace (planned)
blockchain/contracts/   → Solidity smart contracts (planned)
```

## Tech Stack

- **Language:** TypeScript 5.9 (strict mode)
- **Monorepo:** Turborepo 2.7, pnpm 10.24 workspaces
- **Build:** tsup (ESM only, DTS generation, sourcemaps, treeshaking)
- **Lint:** ESLint 9 flat config + Prettier
- **Git Hooks:** Husky + lint-staged + commitlint
- **Backend (planned):** NestJS, Supabase (PostgreSQL + RLS), BullMQ, Redis
- **Frontend (planned):** Next.js, React, TailwindCSS, Zustand
- **Blockchain (planned):** Solidity, ethers.js

## Code Conventions

### TypeScript

- ESM only (`"type": "module"` everywhere). No CommonJS.
- Use `type` imports: `import type { Foo } from '...'` (enforced by ESLint `consistent-type-imports`).
- Prefer interfaces over type aliases for object shapes.
- No `any` — use `unknown` and narrow. (`no-explicit-any` is set to warn.)
- Unused variables must be prefixed with `_` (e.g. `_unused`).
- Module resolution: `bundler` in packages, `NodeNext` at root.
- No default exports in shared packages.
- No classes in domain or contracts — plain interfaces and enums only.

### File & Naming

- Filenames: PascalCase for entities/types (`UserAccount.ts`), camelCase for utilities.
- One entity/interface per file. Barrel exports via `index.ts`.
- Package names: `@ecomsaas/<name>` (kebab-case).

### Build

- All packages build with `tsup`. Config lives in `tsup.config.ts` at package root.
- Subpath exports defined in `package.json` `"exports"` field.
- Build order matters: `domain` must build before `contracts` (contracts resolves domain via dist/\*.d.ts paths).

## Commit Messages

We use **Conventional Commits** with **required scopes**.

Format: `<type>(<scope>): <subject>`

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`

Common scopes: `workspace`, `domain`, `contracts`, `api`, `web`, `ui`, `utils`, `infra`, `docs`, `deps`, `config`, `blockchain`, `contracts`

Examples:

```
feat(domain): add Coupon entity
fix(contracts): correct OrderResponse type
chore(workspace): update turbo pipeline
docs(architecture): reflect domain/contracts split
```

Multiple scopes: `feat(domain, contracts): add subscription types`

See `docs/COMMIT_GUIDE.md` for full reference.

## Branches & Pull Requests

### Branch Naming

Format: `<type>/<scope>` or `<type>/issue-<N>/<description>`

Examples:

```
feat/issue-2-3/shared-domain-contracts
fix/issue-12/checkout-race-condition
chore/upgrade-typescript
```

- Use kebab-case for descriptions.
- Reference issue numbers when applicable.
- Tightly coupled issues can share a single branch (e.g. `issue-2-3`).

### Pull Requests

- **Title format:** `<type>(<scope>): <present-tense verb> <description>`
  - PR titles describe what the PR **implements/does**, in present tense
  - Example: `feat(domain, contracts): implements shared domain layer and API contracts`
- **Body:** Summarize scope, architecture decisions, and testing done.
- **Issue references:** Use `Closes #N` in the PR body to auto-close issues on merge.
- **Commit references:** Use `Refs #N` in individual commit messages (not `Closes`) — let the PR merge trigger the close.

### Workflow

1. Create issue(s) in the repo with descriptive titles and checklists
2. Branch from `main` with a descriptive branch name referencing issue(s)
3. Make focused commits with `Refs #N` linking to the relevant issue
4. Open PR with `Closes #N` in the body
5. Merge → issues auto-close

## Anti-Patterns — Do NOT

- Import from infrastructure or application in domain or contracts.
- Add runtime dependencies to `@ecomsaas/domain`.
- Put business logic in DTOs (contracts package).
- Use relative imports across package boundaries — use `@ecomsaas/<pkg>` imports.
- Use `require()` or CommonJS syntax anywhere.
- Add decorators or framework-specific code to shared packages.
- Combine multiple unrelated changes in one commit.

## Key Documentation

- `docs/ARCHITECTURE.md` — Full system architecture and ADRs
- `docs/IMPLEMENTATION_PLAN.md` — Phased implementation roadmap
- `docs/DECISIONS.md` — Architectural Decision Records
- `docs/COMMIT_GUIDE.md` — Commit message conventions
