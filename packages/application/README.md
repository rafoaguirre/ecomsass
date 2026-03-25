# @ecomsaas/application

Application layer package containing use cases and repository interfaces (ports) for the EcomSaaS platform.

## Overview

This package implements the **Application Layer** in Clean Architecture. It orchestrates business logic through use cases and defines ports (interfaces) for infrastructure dependencies.

**Key Principles:**

- Depends only on `@ecomsaas/domain` (inner layer)
- Defines repository interfaces (ports) that infrastructure implements
- Implements use cases that orchestrate domain logic
- No framework dependencies (framework-agnostic)
- Pure business orchestration, no infrastructure concerns

## Architecture

```
┌─────────────────────────────────────────┐
│         Outer Layers (Infra/UI)         │
│  ┌───────────────────────────────────┐  │
│  │   Application Layer (This pkg)    │  │
│  │  ├── Use Cases (orchestration)    │  │
│  │  └── Ports (repo interfaces)      │  │
│  │       ▼                            │  │
│  │  ┌─────────────────────────────┐  │  │
│  │  │   Domain Layer (@domain)    │  │  │
│  │  │   (entities, value objects) │  │  │
│  │  └─────────────────────────────┘  │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

**Dependency Flow:** Infrastructure → Application → Domain

## Package Structure

```
src/
├── ports/                    # Repository interfaces (dependency inversion)
│   ├── StoreRepository.ts
│   ├── ProductRepository.ts
│   ├── OrderRepository.ts
│   └── index.ts
└── use-cases/               # Business orchestration
    ├── stores/
    │   ├── GetStore.ts
    │   ├── GetStore.test.ts
    │   └── index.ts
    ├── products/
    │   ├── CreateProduct.ts
    │   ├── CreateProduct.test.ts
    │   └── index.ts
    ├── orders/
    │   ├── PlaceOrder.ts
    │   ├── PlaceOrder.test.ts
    │   └── index.ts
    └── index.ts
```

## Ports (Repository Interfaces)

Ports define contracts for persistence operations. Infrastructure layer provides concrete implementations.

### StoreRepository

```typescript
import type { StoreRepository } from '@ecomsaas/application/ports';

interface StoreRepository {
  findById(id: string): Promise<Result<StoreModel, NotFoundError>>;
  findBySlug(slug: string): Promise<Result<StoreModel, NotFoundError>>;
  findByVendorId(vendorProfileId: string): Promise<StoreModel[]>;
  save(store: StoreModel): Promise<Result<StoreModel, Error>>;
  delete(id: string): Promise<Result<void, Error>>;
  slugExists(slug: string, excludeId?: string): Promise<boolean>;
}
```

### ProductRepository

```typescript
import type { ProductRepository } from '@ecomsaas/application/ports';

interface ProductRepository {
  findById(id: string): Promise<Result<ProductModel, NotFoundError>>;
  findBySlug(storeId: string, slug: string): Promise<Result<ProductModel, NotFoundError>>;
  findByStoreId(storeId: string, options?: FilterOptions): Promise<ProductModel[]>;
  save(product: ProductModel): Promise<Result<ProductModel, Error>>;
  slugExists(storeId: string, slug: string, excludeId?: string): Promise<boolean>;
  // ... more methods
}
```

### OrderRepository

```typescript
import type { OrderRepository } from '@ecomsaas/application/ports';

interface OrderRepository {
  findById(id: string): Promise<Result<OrderModel, NotFoundError>>;
  findByReferenceId(referenceId: string): Promise<Result<OrderModel, NotFoundError>>;
  findByStoreId(storeId: string, options?: FilterOptions): Promise<OrderModel[]>;
  findByUserId(userId: string, options?: FilterOptions): Promise<OrderModel[]>;
  save(order: OrderModel): Promise<Result<OrderModel, Error>>;
  generateReferenceId(storeId: string): Promise<string>;
  // ... more methods
}
```

## Use Cases

Use cases implement business workflows by orchestrating domain models and repositories.

### GetStore

Retrieve a store by ID or slug.

```typescript
import { GetStore } from '@ecomsaas/application/use-cases';

const getStore = new GetStore(storeRepository);

// By slug (default)
const result = await getStore.execute({ identifier: 'my-store' });

// By ID
const result = await getStore.execute({
  identifier: 'store-123',
  identifierType: 'id',
});

if (result.isOk()) {
  const store = result.unwrap();
  console.log(store.name);
}
```

### CreateProduct

Create a new product in a store.

**Business Rules:**

- Store must exist
- Product slug must be unique within the store
- All product invariants must be satisfied (price > 0, valid slug, etc.)

```typescript
import { CreateProduct } from '@ecomsaas/application/use-cases';

const createProduct = new CreateProduct(productRepository, storeRepository);

const result = await createProduct.execute({
  id: 'prod-123',
  storeId: 'store-456',
  name: 'Premium Headphones',
  slug: 'premium-headphones',
  price: { amount: 19999n, currency: 'USD' }, // $199.99
  inventory: {
    quantity: 50,
    trackQuantity: true,
    lowStockThreshold: 10,
  },
});

if (result.isOk()) {
  const product = result.unwrap();
  console.log('Product created:', product.id);
}
```

### PlaceOrder

Create a new order for a customer.

**Business Rules:**

- Store must exist and be active
- All products must exist and belong to the store
- All products must be available
- Order totals are calculated from product prices
- Payment is initialized as pending

```typescript
import { PlaceOrder } from '@ecomsaas/application/use-cases';
import { PaymentMethod } from '@ecomsaas/domain/enums';

const placeOrder = new PlaceOrder(orderRepository, productRepository, storeRepository);

const result = await placeOrder.execute({
  storeId: 'store-123',
  userId: 'user-456',
  items: [
    { productId: 'prod-1', quantity: 2 },
    { productId: 'prod-2', quantity: 1 },
  ],
  paymentMethod: PaymentMethod.Credit,
  fulfillment: {
    address: {
      street1: '123 Main St',
      city: 'San Francisco',
      state: 'CA',
      postalCode: '94102',
      country: 'US',
    },
  },
  notes: 'Please deliver before 5pm',
});

if (result.isOk()) {
  const order = result.unwrap();
  console.log('Order placed:', order.referenceId);
  console.log('Total:', order.total);
}
```

## Testing

All use cases have comprehensive unit tests with mocked repositories.

```bash
# Run tests
pnpm test

# Watch mode
pnpm test:watch

# With coverage
pnpm test -- --coverage
```

### Example Test

```typescript
import { describe, it, expect, vi } from 'vitest';
import { GetStore } from '@ecomsaas/application/use-cases';

describe('GetStore Use Case', () => {
  it('should retrieve a store by slug', async () => {
    const mockRepo: StoreRepository = {
      findBySlug: vi.fn().mockResolvedValue(ok(mockStore)),
      // ... other methods
    };

    const getStore = new GetStore(mockRepo);
    const result = await getStore.execute({ identifier: 'test-store' });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.name).toBe('Test Store');
    }
  });
});
```

## Development

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Development mode (watch)
pnpm dev

# Type checking
pnpm type-check

# Linting
pnpm lint

# Clean build artifacts
pnpm clean
```

## Design Patterns

### Dependency Inversion Principle (SOLID)

Application layer defines **ports** (interfaces) that infrastructure implements. This inverts the dependency:

```
Application (defines interface) ← Infrastructure (implements)
```

### Use Case Pattern

Each use case is a single class with an `execute()` method. Benefits:

- **Single Responsibility:** Each use case does one thing
- **Testability:** Easy to test with mocked repositories
- **Clarity:** Business logic is explicit and discoverable
- **Reusability:** Use cases can be composed and reused

### Result Pattern

All operations return `Result<T, E>` for explicit error handling:

```typescript
const result = await useCase.execute(input);

if (result.isOk()) {
  const data = result.value; // Type: T
} else {
  const error = result.error; // Type: E
}
```

## Contributing

When adding new use cases:

1. Create the use case class in the appropriate directory
2. Define input/output types
3. Add comprehensive unit tests
4. Document with JSDoc and usage examples
5. Update this README if adding new patterns

## License

See root LICENSE file.
