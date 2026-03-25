# @ecomsaas/validation

Shared Zod schemas and validation helpers for EcomSaaS.

## What this package provides

- Value-object schemas (money, address, image, schedules)
- Domain entity schemas (store, product, order, subscription, identity, and supporting entities)
- API request DTO schemas (create store/product/order/subscription)
- Validation helpers for parse/safe-parse workflows

## Installation

```bash
pnpm add @ecomsaas/validation
```

## Usage

```typescript
import { CreateOrderRequestSchema } from '@ecomsaas/validation/schemas';
import { validateSchema } from '@ecomsaas/validation/helpers';

const payload = validateSchema(CreateOrderRequestSchema, req.body);
```
