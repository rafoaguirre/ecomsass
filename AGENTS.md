# Codex Instructions (Repo Entry)

Use `docs/AGENT_GUIDE.md` as the shared source of truth for this repository.

## Required Reads

1. `docs/AGENT_GUIDE.md`
2. Relevant package-level overrides when working inside:
   - `packages/domain/.github/copilot-instructions.md`
   - `packages/contracts/.github/copilot-instructions.md`

## Notes

- If guidance conflicts, follow user request first, then `docs/AGENT_GUIDE.md`.
- Keep changes aligned with Clean Architecture boundaries and workspace reality.
- Follow secrets hygiene in `docs/AGENT_GUIDE.md`:
  - never commit real credentials
  - use placeholders in examples
  - respect CI Gitleaks scanning and minimal allowlist policy
