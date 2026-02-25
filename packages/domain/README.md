# @ecomsaas/domain

Core domain layer for the EcomSaaS platform — entities, value objects, enums, rich domain models, and DDD building blocks.

## Purpose

This package is the **innermost ring** of Clean Architecture — the stable core that everything else depends on and that depends on nothing. It contains pure TypeScript with zero external dependencies.

## Structure

- **core/** — DDD building blocks: `Entity`, `AggregateRoot`, `ValueObject`, `Result<T,E>`, `DomainEvent`
- **entities/** — Interfaces for domain entities (UserAccount, VendorProfile, Store, Product, Order, etc.)
- **value-objects/** — Immutable type definitions and classes (Money, MoneyVO, Address, GeoPoint, Image, Schedule, Quantity)
- **enums/** — Business enums (20+ covering all domain concepts)
- **errors/** — Typed domain error hierarchy: `DomainError`, `ValidationError`, `InvariantError`, `NotFoundError`
- **models/** — Rich domain model classes with business logic, validation, and immutable updates (StoreModel, ProductModel)

## Usage

```typescript
// Entity interfaces
import type { Store, Product, Order } from '@ecomsaas/domain/entities';

// Value objects
import type { Money, Address } from '@ecomsaas/domain/value-objects';
import { MoneyVO } from '@ecomsaas/domain/value-objects';

// Enums
import { OrderStatus, PaymentMethod } from '@ecomsaas/domain/enums';

// Core DDD building blocks
import { AggregateRoot, ValueObject } from '@ecomsaas/domain/core';

// Typed errors
import { ValidationError, InvariantError } from '@ecomsaas/domain/errors';

// Rich domain models
import { StoreModel, ProductModel } from '@ecomsaas/domain/models';
```

### Money Value Object

All monetary amounts use `bigint` in the smallest currency unit (cents, satoshi, wei). Never use floating-point for currency.

```typescript
const price = MoneyVO.fromDecimal('12.50', 'USD'); // 1250 cents
const tax = price.multiply(0.13); // $1.62
const total = price.add(tax); // $14.12
total.toDisplayString(); // "$14.12"

// Crypto currencies supported
const fee = MoneyVO.fromDecimal('0.5', 'USDC'); // 500000 micro-USDC
fee.toDisplayString(); // "0.500000 USDC"
```

Supported currencies: `USD`, `CAD`, `EUR`, `GBP` (2 decimals), `BTC` (8), `USDC` (6), `MATIC`/`POL` (18).

## Architecture

This package follows the Clean Architecture dependency rule:

```
@ecomsaas/contracts → @ecomsaas/domain  ← @ecomsaas/application
     (outer)              (inner)              (middle)
```

- **Zero dependencies** — does not import from any other package
- **Framework-agnostic** — usable in frontend, backend, and external tools

## Philosophy

> "The domain layer is the thing that doesn't change when you change your database, your framework, or your UI."

If you're adding something here, ask: _would this concept exist even if we had no API, no database, and no UI?_ If yes, it belongs here. If not, it likely belongs in `@ecomsaas/contracts` or an outer layer.

## Build & Test

```bash
pnpm build       # tsup → dist/
pnpm type-check  # tsc --noEmit
pnpm test        # vitest run (159 tests)
pnpm lint        # eslint src/
```
