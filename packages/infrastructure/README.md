# @ecomsaas/infrastructure

Shared infrastructure utilities for the EcomSaaS platform. This package provides framework-agnostic abstractions for common infrastructure concerns following Clean Architecture principles.

## Features

- 🆔 **ID Generator** - Unique ID generation with configurable prefixes
- 📝 **Logger** - Structured logging with Pino
- 🌐 **HTTP Client** - Fetch-based client with retry, auth, and error handling
- 🔐 **Secrets Manager** - Environment-aware secret management
- 💾 **Cache** - In-memory caching with TTL support
- 📮 **Queue** - Message queue abstraction
- 🗄️ **Database** - Database connection interface with transactions
- 📦 **Storage** - Object storage abstraction
- 🔍 **Tracing** - Distributed tracing interface

## Installation

```bash
pnpm add @ecomsaas/infrastructure
```

## Usage

### ID Generator

Generate unique IDs with optional prefixes:

```typescript
import { createIdGenerator } from '@ecomsaas/infrastructure/id-generator';

const idGen = createIdGenerator();

const orderId = idGen.generate('ord'); // ord_1234567890abc
const userIds = idGen.generateBatch(10, 'usr'); // ['usr_...', 'usr_...', ...]
```

### Logger

Structured logging with Pino:

```typescript
import { createLogger } from '@ecomsaas/infrastructure/logger';

const logger = createLogger({
  level: 'info',
  name: 'my-service',
  pretty: process.env.NODE_ENV !== 'production',
});

logger.info('User created', { userId: '123', email: 'user@example.com' });
logger.error('Failed to process order', new Error('Payment failed'), { orderId: '456' });

// Create child logger with bound context
const requestLogger = logger.child({ requestId: 'req-123' });
requestLogger.info('Processing request');
```

### HTTP Client

REST client with authentication, retry, and error handling:

```typescript
import { createHttpClient } from '@ecomsaas/infrastructure/http';

const client = createHttpClient({
  baseUrl: 'https://api.example.com',
  timeout: 5000,
  retry: {
    maxAttempts: 3,
    initialDelay: 1000,
  },
  authTokenProvider: async () => 'your-auth-token',
});

// Make requests
const user = await client.get<User>('/users/123');
const newUser = await client.post<User>('/users', {
  name: 'John Doe',
  email: 'john@example.com',
});
```

### Secrets Manager

Environment-aware secret management:

```typescript
import { createSecretsManager, preloadSecrets } from '@ecomsaas/infrastructure/secrets';

const secrets = createSecretsManager({ type: 'env' });

const apiKey = await secrets.getRequired('API_KEY');
const dbUrl = await secrets.get('DATABASE_URL');

if (await secrets.has('STRIPE_SECRET')) {
  // Use Stripe
}

// Startup preload pattern (fetch once, then use in-process values)
const runtimeSecrets = await preloadSecrets(secrets, ['DATABASE_URL', 'JWT_SECRET'], {
  attachToEnv: true,
  overwriteExisting: false,
});

// Inject runtimeSecrets into your configuration container/module.
console.log(runtimeSecrets.DATABASE_URL);
```

Infisical integration is supported directly in infrastructure:

```typescript
import { createSecretsManager } from '@ecomsaas/infrastructure/secrets';

const secrets = createSecretsManager({
  type: 'infisical',
  infisical: {
    clientId: process.env.INFISICAL_CLIENT_ID!,
    clientSecret: process.env.INFISICAL_CLIENT_SECRET!,
    projectId: process.env.INFISICAL_PROJECT_ID!,
    environment: process.env.INFISICAL_ENVIRONMENT ?? 'dev',
    secretPath: '/',
    siteUrl: process.env.INFISICAL_SITE_URL,
  },
});
```

You can still provide a custom `infisicalClient` override for tests.

### Cache

In-memory cache with TTL:

```typescript
import { createCache } from '@ecomsaas/infrastructure/cache';

const cache = createCache({ cleanupIntervalMs: 60000 });

// Set with 5 minute TTL
await cache.set('user:123', user, 300);

// Get
const cachedUser = await cache.get<User>('user:123');

// Multi-get/set
await cache.mset(
  {
    'product:1': product1,
    'product:2': product2,
  },
  600
);

const products = await cache.mget(['product:1', 'product:2']);
```

### Queue

Message queue for async processing:

```typescript
import { createQueue } from '@ecomsaas/infrastructure/queue';

const queue = createQueue();

// Send message
await queue.send({ orderId: '123', action: 'process' });

// Send with delay (5 seconds)
await queue.send({ orderId: '124', action: 'notify' }, 5);

// Receive messages
const messages = await queue.receive(10, 30); // max 10, 30s visibility timeout

for (const msg of messages) {
  try {
    // Process message
    await processOrder(msg.data);
    await queue.delete(msg.id);
  } catch (error) {
    // Message will become visible again after timeout
  }
}
```

### Database

Database abstraction with transactions:

```typescript
import { createDatabase } from '@ecomsaas/infrastructure/database';

const db = createDatabase({ type: 'memory' });

// Execute queries
const users = await db.query<User>('SELECT * FROM users WHERE active = ?', [true]);
const user = await db.queryOne<User>('SELECT * FROM users WHERE id = ?', [123]);

// Execute commands
const rowsAffected = await db.execute('UPDATE users SET active = ? WHERE id = ?', [false, 123]);

// Use transactions
const tx = await db.beginTransaction();
try {
  await tx.query('INSERT INTO orders (user_id, total) VALUES (?, ?)', [123, 99.99]);
  await tx.query('UPDATE inventory SET stock = stock - 1 WHERE product_id = ?', [456]);
  await tx.commit();
} catch (error) {
  await tx.rollback();
  throw error;
}
```

### Storage

Object storage abstraction:

```typescript
import { createStorage } from '@ecomsaas/infrastructure/storage';

const storage = createStorage({ type: 'memory' });

// Upload file
await storage.put('images/product-1.jpg', buffer, {
  contentType: 'image/jpeg',
});

// Download file
const obj = await storage.get('images/product-1.jpg');
console.log(obj.data, obj.metadata);

// List files
const images = await storage.list('images/');

// Get signed URL
const url = await storage.getSignedUrl('images/product-1.jpg', 3600);
```

### Tracing

Distributed tracing:

```typescript
import { createTracer } from '@ecomsaas/infrastructure/tracing';

const tracer = createTracer({ type: 'console', serviceName: 'api' });

// Auto-trace async operations
const result = await tracer.trace('create-order', async (span) => {
  span.setAttribute('userId', user.id);
  span.addEvent('validating-payment');

  // Your operation
  const order = await createOrder(user);

  span.setAttribute('orderId', order.id);
  return order;
});

// Manual span control
const span = tracer.startSpan('process-payment', { orderId: '123' });
try {
  await processPayment();
  span.setStatus('ok');
} catch (error) {
  span.recordError(error);
  throw error;
} finally {
  span.end();
}
```

## Architecture

All modules follow these principles:

1. **Interface-based** - Each module exposes interfaces for dependency injection
2. **Framework-agnostic** - No coupling to specific frameworks (NestJS, Express, etc.)
3. **Multiple implementations** - Production adapters where implemented, with in-memory/reference implementations for testing and early integration
4. **Factory functions** - Use `create*` functions for instantiation
5. **Subpath exports** - Import from specific modules to minimize bundle size

## Testing

All modules include in-memory or no-op implementations perfect for testing:

```typescript
import { InMemoryCache } from '@ecomsaas/infrastructure/cache';
import { InMemorySecretsManager } from '@ecomsaas/infrastructure/secrets';
import { NoOpTracer } from '@ecomsaas/infrastructure/tracing';

// Use in tests
const cache = new InMemoryCache();
const secrets = new InMemorySecretsManager();
const tracer = new NoOpTracer();
```

## Development

```bash
# Build
pnpm build

# Test
pnpm test

# Type check
pnpm type-check

# Lint
pnpm lint
```

## License

MIT
