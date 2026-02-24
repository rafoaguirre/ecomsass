# @ecomsaas/domain

Core domain layer: entities, value objects, and business enums for the EcomSaaS platform.

## Purpose

This package is the **innermost ring** of Clean Architecture — the stable core that everything else depends on and that depends on nothing. It contains pure TypeScript interfaces and enums with zero external dependencies.

## Structure

- **entities/** - Plain interfaces for domain entities (UserAccount, VendorProfile, Store, Product, Order, etc.)
- **value-objects/** - Simple type definitions (Money, Address, GeoPoint, Image, Schedule, Quantity)
- **enums/** - Business enums (20+ enums covering all domain concepts)

## Usage

```typescript
import type { Store, Product, Order } from '@ecomsaas/domain/entities';
import type { Money, Address } from '@ecomsaas/domain/value-objects';
import { OrderStatus, PaymentMethod } from '@ecomsaas/domain/enums';
```

## Architecture

This package follows the Clean Architecture dependency rule:

```
@ecomsaas/contracts → @ecomsaas/domain  ← @ecomsaas/application
     (outer)              (inner)              (middle)
```

- **Zero dependencies** — does not import from any other package
- **No business logic yet** — Phase 0.1 establishes interfaces; Phase 0.2+ adds rich models
- **Framework-agnostic** — usable in frontend, backend, and external tools
- **Plain interfaces** — no classes, decorators, or runtime code

## Philosophy

> "The domain layer is the thing that doesn't change when you change your database, your framework, or your UI."

If you're adding something here, ask: _would this concept exist even if we had no API, no database, and no UI?_ If yes, it belongs here. If not, it likely belongs in `@ecomsaas/contracts` or an outer layer.

## Roadmap

**Current (Phase 0.1):**

- Plain TypeScript interfaces (entities, value-objects)
- Business enums

**Future (Phase 0.2+):**

- Rich domain models with business logic
- Domain services
- Value object classes with validation
- Domain events
