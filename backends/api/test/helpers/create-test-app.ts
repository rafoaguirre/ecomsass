import { type INestApplication } from '@nestjs/common';
import { Test, type TestingModuleBuilder } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { SUPABASE_CLIENT, SUPABASE_ANON_CLIENT } from '../../src/database';
import {
  createMockSupabaseClient,
  type MockSupabaseClient,
  type MockSupabaseOptions,
} from './mock-supabase';

// Fallback env vars so NestJS ConfigModule/DatabaseModule factories don't throw
// during module compilation. Providers are overridden with mocks after compile,
// but NestJS still resolves the original factory deps during resolution.
//
// Uses ??= to avoid overwriting real values (e.g. when running against a local
// Supabase instance). This is an intentional tradeoff: it hides missing-config
// failures in the test environment, but e2e tests are not the right layer to
// validate bootstrap config — that belongs in a dedicated config validation test.
process.env.SUPABASE_URL ??= 'http://localhost:54321';
process.env.SUPABASE_ANON_KEY ??= 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY ??= 'test-service-role-key';
process.env.SUPABASE_JWT_SECRET ??= 'test-jwt-secret-at-least-32-chars-long';

export interface TestApp {
  app: INestApplication;
  /** The mock Supabase client used for service-role operations (repositories). */
  supabaseClient: MockSupabaseClient;
  /** The mock Supabase client used for anon/auth-guard operations. */
  supabaseAnonClient: MockSupabaseClient;
  /** Tear down the application. Call in afterAll/afterEach. */
  close: () => Promise<void>;
}

export interface CreateTestAppOptions {
  /** Controls what the anon client's auth.getUser returns. */
  auth?: MockSupabaseOptions;
  /** Custom overrides applied to the testing module builder before compile. */
  customize?: (builder: TestingModuleBuilder) => TestingModuleBuilder;
}

/**
 * Bootstrap a real NestJS application with mocked Supabase clients.
 *
 * This gives HTTP-level e2e coverage:  supertest → Express → NestJS pipeline
 * (guards, pipes, controllers, services) → mocked Supabase.
 *
 * @example
 * ```ts
 * const { app, supabaseClient, close } = await createTestApp({
 *   auth: { authUser: { id: 'u1', role: 'Vendor' } },
 * });
 * // use supertest(app.getHttpServer())…
 * await close();
 * ```
 */
export async function createTestApp(options: CreateTestAppOptions = {}): Promise<TestApp> {
  const supabaseClient = createMockSupabaseClient();
  const supabaseAnonClient = createMockSupabaseClient(options.auth ?? {});

  let builder = Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(SUPABASE_CLIENT)
    .useValue(supabaseClient)
    .overrideProvider(SUPABASE_ANON_CLIENT)
    .useValue(supabaseAnonClient);

  if (options.customize) {
    builder = options.customize(builder);
  }

  const moduleRef = await builder.compile();
  const app = moduleRef.createNestApplication();
  await app.init();

  return {
    app,
    supabaseClient,
    supabaseAnonClient,
    close: () => app.close(),
  };
}
