# @ecomsaas/contracts

API contracts, DTOs, and shared protocol types for the EcomSaaS platform.

## Purpose

This package lives in the **interface-adapter layer** of Clean Architecture. It defines the shapes that cross architectural boundaries — API request/response contracts, pagination, error formats, and other protocol-specific types.

## Structure

- **dtos/** - Data Transfer Objects for API contracts (auth, stores, products, orders, subscriptions)
- **common/** - Shared API utilities (responses, pagination, errors, filters)

## Usage

```typescript
import type { CreateStoreRequest, StoreResponse } from '@ecomsaas/contracts/dtos';
import type { ApiResponse, OffsetPaginatedResponse } from '@ecomsaas/contracts/common';
import { ErrorCode, createSuccessResponse } from '@ecomsaas/contracts/common';
```

## Dependency Direction

```
@ecomsaas/contracts → @ecomsaas/domain
        (outer)              (inner)
```

DTOs reference domain entities and enums via `@ecomsaas/domain`. The domain package has **zero knowledge** of this package — dependencies point strictly inward per the Clean Architecture dependency rule.

## Why a Separate Package?

DTOs and API response shapes change at a different rate than domain entities. Keeping them separate means:

- **Domain stays stable** — adding an API field doesn't touch the core
- **Protocol changes are isolated** — versioning, pagination strategies, error formats evolve independently
- **Consumers import what they need** — frontends use contracts, backend services use domain
