# EcomSaaS

A modern, scalable multi-tenant e-commerce platform enabling vendors to create and manage online stores with integrated blockchain features.

> **Portfolio Project**: This project demonstrates modern full-stack development practices, clean architecture, monorepo organization, and integration of cutting-edge technologies including TypeScript, blockchain (Polygon), and AI-powered features.

> **🤖 AI-Assisted Development**: This project leverages generative AI (GitHub Copilot, Claude) as development tools for code generation and documentation. All AI-generated code is reviewed, refined, tested, and supervised by the developer. Architectural decisions, system design, and implementation strategies are human-driven. This approach demonstrates effective collaboration with modern AI development tools while maintaining code quality and understanding.

> **⚠️ Security Notice**: This is a portfolio/learning project with security features being implemented progressively. It is not yet production-ready. Deep security hardening, compliance measures, and comprehensive penetration testing will be added in later development phases.

## 📚 Documentation

- **[Architecture Overview](docs/ARCHITECTURE.md)** - System design, technology stack, and architectural decisions
- **[Implementation Plan](docs/IMPLEMENTATION_PLAN.md)** - Detailed phased development roadmap
- **[Technical Decisions](docs/DECISIONS.md)** - Quick reference for all key technical decisions
- **[Commit Guide](docs/COMMIT_GUIDE.md)** - Commit message conventions and guidelines
- **[TypeScript Config Examples](docs/TSCONFIG_EXAMPLES.md)** - Package configuration patterns

## ✨ Key Features

- **Multi-Tenant Stores**: Vendors create branded stores accessible via subdomains
- **Marketplace**: Central discovery platform for all vendor stores
- **Multi-Vendor Cart**: Customers shop from multiple stores in one transaction
- **Stripe Connect**: Automated payment splitting with platform fees
- **Blockchain Integration**: Crypto payments, fundraising, and rewards system (Polygon)
- **AI-Powered Management**: MCP server for natural language store configuration
- **Clean Architecture**: Shared domain and application layers across all services

## 🏗️ Architecture

This monorepo contains multiple applications and shared packages following clean architecture principles.

### Workspace Structure

```
ecomsaas/
├── backends/          # Backend services (APIs, microservices)
├── clients/           # Frontend applications (web, mobile, admin)
├── packages/          # Shared TypeScript packages (utilities, types, configs)
├── blockchain/        # Smart contracts and blockchain integrations
├── infra/            # Infrastructure as Code (Terraform, K8s manifests)
├── docs/             # Documentation
└── scripts/          # Build and deployment scripts
```

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v24.2.0 (see `.nvmrc`)
- **pnpm**: 10.24.0+
- **Git**: Latest version

### Installation

```bash
# Use the correct Node version
nvm use

# Install dependencies
pnpm install

# Build all packages
pnpm build
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
pnpm --filter @ecomsaas/backend add express

# Run a command in a specific workspace
pnpm --filter @ecomsaas/web dev

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

- **Backend services**: `module: "commonjs"`, `moduleResolution: "node"`
- **Web applications**: `module: "esnext"`, `moduleResolution: "bundler"`
- **Mobile apps**: React Native specific configuration
- **Shared packages**: ESM-based for maximum compatibility

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
