# EcomSaaS

A modern, scalable e-commerce platform built as a monorepo using TypeScript, Turborepo, and pnpm workspaces.

> **Note**: This is a portfolio project demonstrating modern full-stack development practices, monorepo architecture, and system design skills. It showcases integration of various technologies including TypeScript, microservices, blockchain, and cloud infrastructure.

## 🏗️ Architecture

This is a monorepo containing multiple applications and shared packages for building a comprehensive e-commerce system with blockchain integration.

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
- **Language**: TypeScript
- **Code Quality**: ESLint, Prettier, Husky, lint-staged
- **Commits**: Conventional Commits with commitlint

## 📝 Contributing

### Commit Convention

This project uses [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new payment gateway
fix: resolve checkout cart issue
docs: update API documentation
chore: upgrade dependencies
```

### Git Hooks

- **pre-commit**: Runs lint-staged (ESLint + Prettier on staged files)
- **commit-msg**: Validates commit messages follow conventional commits

## 📄 License

ISC License - This project is open source for learning and portfolio purposes.

The ISC license allows anyone to use, modify, and distribute this code freely, including for commercial purposes, with minimal restrictions. As the original author, I retain the right to use this codebase for any purpose, including private commercial ventures.

See the LICENSE file for full details.

## 👥 Team

[Your team information here]
