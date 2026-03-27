# Copilot Instructions — EcomSaaS Monorepo

Use `docs/AGENT_GUIDE.md` as the primary instruction source for this repository.

## Required Context

1. `docs/AGENT_GUIDE.md`
2. Relevant architecture and planning docs when needed:
   - `docs/ARCHITECTURE.md`
   - `docs/IMPLEMENTATION_PLAN.md`
   - `docs/DECISIONS.md`
3. Package-level overrides when editing package internals:
   - `packages/domain/.github/copilot-instructions.md`
   - `packages/contracts/.github/copilot-instructions.md`

## Copilot-Specific Expectations

- Prefer minimal, scoped changes over large speculative scaffolding.
- Do not import planned packages that do not exist yet unless explicitly creating them as part of the task.
- Never commit real secrets/tokens/credentials; use placeholders in docs/examples.
- Assume CI secret scanning is mandatory (Gitleaks) and keep allowlist changes minimal and explicit.
- For non-trivial changes, run and report:
  - `pnpm build`
  - `pnpm type-check`
  - `pnpm test`
  - `pnpm lint`
- Keep docs in sync when implementation status changes.
