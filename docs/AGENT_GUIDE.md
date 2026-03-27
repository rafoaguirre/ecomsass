# Agent Guide (Shared for Copilot and Codex)

This document is the shared instruction source for AI coding agents working in this repository.

## Scope and Precedence

1. User request and explicit task constraints
2. This guide (`docs/AGENT_GUIDE.md`)
3. Tool-specific wrappers:
   - `.github/copilot-instructions.md`
   - `AGENTS.md`
4. Package-level overrides in `packages/*/.github/copilot-instructions.md`

## Repository Reality

Implemented workspaces:

- `packages/domain`
- `packages/contracts`
- `packages/application`
- `packages/validation`
- `packages/infrastructure`
- `packages/ui`
- `backends/api` (scaffold)
- `clients/storefront` (scaffold)
- `clients/vendor` (scaffold)
- `blockchain/contracts` (Foundry scaffold)

Planned but not yet created:

- `packages/utils`
- `packages/config`
- `backends/worker`
- `backends/mcp`
- Terraform modules under `infra/terraform`

Do not add imports from planned packages unless the task explicitly creates them.

## Architecture Guardrails

- Follow Clean Architecture dependency direction:
  - `domain` (innermost, no runtime deps)
  - `contracts` depends on `domain`
  - outer layers depend inward only
- Domain code must not import framework/runtime concerns (NestJS, Next.js, DB clients, HTTP, UI).
- Keep business logic out of DTO packages.
- Use workspace package imports across package boundaries (no deep relative cross-package imports).

## SOLID Application (Practical)

Use SOLID as decision guidance, especially in shared packages (`domain`, `contracts`, future `application`):

- **Single Responsibility (S):**
  - Keep classes/modules focused (one reason to change).
  - Avoid mixing business rules, transport concerns, and infra concerns in one unit.
- **Open/Closed (O):**
  - Prefer extension via new use cases, adapters, and composition over editing core stable logic.
  - Add behavior with new modules instead of branching core domain paths repeatedly.
- **Liskov Substitution (L):**
  - Implementations of shared interfaces must preserve expected behavior and invariants.
  - Do not create adapters/models that silently weaken contracts.
- **Interface Segregation (I):**
  - Prefer small, focused ports/interfaces.
  - Avoid “god interfaces” that force consumers to depend on methods they do not use.
- **Dependency Inversion (D):**
  - Inner layers depend on abstractions (ports), not concrete frameworks/services.
  - Infrastructure implements ports; application/domain define behavior contracts.

### SOLID Review Checklist

When reviewing PRs touching shared packages, validate:

- Does each new class/module have a single clear purpose?
- Are interfaces minimal and consumer-focused?
- Are dependencies pointing inward per Clean Architecture?
- Is new behavior added via extension/composition rather than invasive core edits?
- Are invariants/contracts preserved across implementations?

### Forbidden Import Rules

- `packages/domain/**`:
  - MUST NOT import from:
    - `@nestjs/*`
    - `next/*`
    - `react`
    - `react-dom`
    - `express`
    - `@supabase/*`
    - `@ecomsaas/contracts`
    - any future outer-layer `@ecomsaas/*` package
  - MUST keep runtime dependencies empty (dev tooling only).
- `packages/contracts/**`:
  - MAY import only from:
    - `@ecomsaas/domain`
    - `@ecomsaas/domain/*`
  - MUST NOT import from framework/runtime layers or app workspaces.

### Enforcement Plan

- Prefer adding an automated boundary check (ESLint `no-restricted-imports` and/or dependency-cruiser) so dependency rules are enforceable in CI.
- Until automation is in place, every PR touching `domain` or `contracts` should include an explicit boundary-check review note.

## Change Workflow (Definition of Done)

For non-trivial code changes, complete all of these before finishing:

1. Implement code changes.
2. Update docs affected by behavior or project-state changes.
3. Run validation commands:
   - `pnpm build`
   - `pnpm type-check`
   - `pnpm test`
   - `pnpm lint`
4. Report what passed/failed and why.

If any step cannot run, state that explicitly.

## Files and Paths to Treat as Generated

Avoid manual edits to generated outputs unless the task explicitly requests it:

- `**/dist/**`
- `**/.next/**`
- `**/out/**`
- `**/.turbo/**`
- `**/*.tsbuildinfo`
- `blockchain/contracts/out/**`
- `blockchain/contracts/cache/**`

Prefer editing source files under `src/` and config files at workspace roots.

## Documentation Hygiene

- Keep implementation status current in:
  - `docs/IMPLEMENTATION_PLAN.md`
  - `.github/copilot-instructions.md`
  - `README.md` (when user-facing scope changes)
- Avoid hard-coded test counts in multiple files unless updated together.
- When status changes, include concrete workspace/file evidence in updates.

## Secrets and Security Hygiene

- Never commit real secrets, credentials, private keys, or live tokens.
- Use placeholders in examples (`<your-key>`, `env(VAR_NAME)`) and `.env.example` files.
- Do not paste secret values into docs, tests, seed files, comments, or commit messages.
- Keep secret loading explicit and allow-listed (no bulk export of all provider secrets).
- CI secret scanning is enforced with Gitleaks:
  - Workflow: `.github/workflows/ci.yml` (`secret-scan` job)
  - Config: `.gitleaks.toml`
- If a false positive is discovered, prefer narrow regex allowlist entries with an explanation in PR notes.
- If a real secret is exposed, treat it as compromised: rotate it and remove it from history/process immediately.

## Commit and PR Conventions

- Follow Conventional Commits with required scope.
- Use `docs/COMMIT_GUIDE.md` as authoritative reference.
- Keep commits logically scoped; avoid mixing unrelated refactors.
