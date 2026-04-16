# Commit Message Guide

This project follows [Conventional Commits](https://www.conventionalcommits.org/) with **required scopes** for better organization in our monorepo.

## Format

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

## Rules

1. **Scope is REQUIRED** - Every commit must specify what part of the monorepo is affected
2. **Use kebab-case** for scopes
3. **Multiple scopes allowed** - Use comma separation: `feat(api, web): add feature`
4. **Keep subject line under 100 characters**
5. **Use imperative mood** - "add feature" not "added feature"

## Commit Types

| Type       | Description                                          | Example                                    |
| ---------- | ---------------------------------------------------- | ------------------------------------------ |
| `feat`     | New feature                                          | `feat(api): add user authentication`       |
| `fix`      | Bug fix                                              | `fix(web): resolve checkout cart issue`    |
| `docs`     | Documentation only                                   | `docs(readme): update setup instructions`  |
| `style`    | Code style changes (formatting, semicolons, etc)     | `style(web): format components`            |
| `refactor` | Code restructuring without behavior change           | `refactor(api): reorganize auth module`    |
| `perf`     | Performance improvements                             | `perf(api): optimize database queries`     |
| `test`     | Adding or updating tests                             | `test(utils): add unit tests`              |
| `build`    | Build system or external dependencies                | `build(deps): upgrade typescript to 5.9.3` |
| `ci`       | CI/CD configuration changes                          | `ci(github): add automated deployment`     |
| `chore`    | Maintenance tasks, tooling, config (no code changes) | `chore(workspace): setup prettier`         |
| `revert`   | Revert a previous commit                             | `revert(api): revert feature X`            |

## Allowed Scopes

### Workspace-level

- `workspace` - Monorepo-wide changes
- `monorepo` - Monorepo configuration
- `deps` - Dependency updates
- `ci` - CI/CD pipelines
- `config` - Configuration files

### Backend Services

- `api` - Main API service
- `worker` - Background worker and scheduled jobs
- `backend` - Backend services (general)
- `auth` - Authentication service
- `payments` - Payment processing

### Frontend Applications

- `web` - Web application
- `mobile` - Mobile application
- `admin` - Admin dashboard
- `client` - Client applications (general)

### Blockchain

- `contracts` - Smart contracts
- `blockchain` - Blockchain integration
- `web3` - Web3 functionality

### Shared Packages

- `types` - TypeScript types
- `utils` - Utility functions
- `shared` - Shared code
- `ui` - UI component library
- `components` - Shared components

### Infrastructure

- `infra` - Infrastructure as Code
- `docker` - Docker configuration
- `k8s` - Kubernetes manifests
- `terraform` - Terraform configs

### Documentation

- `docs` - Documentation

## Examples

### Single scope

```bash
feat(api): add user registration endpoint
fix(web): resolve broken checkout flow
docs(readme): add installation instructions
chore(config): setup eslint and prettier
```

### Multiple scopes

```bash
feat(api, web): implement real-time notifications
fix(mobile, web): resolve authentication state sync
refactor(types, utils): consolidate shared interfaces
```

### With body and footer

```bash
feat(api): add payment processing with Stripe

Integrate Stripe API for handling customer payments.
Includes webhook support for payment confirmation.

BREAKING CHANGE: Payment API endpoints now require authentication
Closes #123
```

## Breaking Changes

For commits with breaking changes, add `BREAKING CHANGE:` in the footer:

```bash
refactor(api): change authentication flow

BREAKING CHANGE: Auth endpoints now require API key in header
```

Or use `!` after type/scope:

```bash
refactor(api)!: change authentication flow
```

## Tips

1. **Think about scope first** - What part of the monorepo does this affect?
2. **Keep commits focused** - One logical change per commit
3. **Use multiple scopes sparingly** - Usually indicates commit could be split
4. **Write meaningful subjects** - Someone should understand the change without reading code

## Testing Your Commit Message

The `commit-msg` git hook will automatically validate your commit message format. If it fails, you'll see an error explaining what's wrong.

You can also test a message manually:

```bash
echo "feat(api): add new endpoint" | pnpm commitlint
```

## Related Tools

- **Commitlint**: Validates commit message format
- **Husky**: Runs commitlint on every commit
- **Conventional Commits**: Standard this project follows
