import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import {
  createSecretsManager,
  preloadSecrets,
  type SecretsManagerOptions,
} from '@ecomsaas/infrastructure/secrets';
import { AppModule } from './app.module';
import { REQUIRED_SECRET_KEYS } from './config';

async function bootstrap() {
  // 1. Resolve required secrets into process.env before NestJS boots.
  //    In local dev this reads from .env via EnvSecretsManager.
  //    Set SECRETS_PROVIDER=infisical to load secrets from Infisical.
  const VALID_PROVIDERS = ['env', 'infisical'] as const;
  type SecretsProvider = (typeof VALID_PROVIDERS)[number];
  const raw = process.env.SECRETS_PROVIDER ?? 'env';

  if (!VALID_PROVIDERS.includes(raw as SecretsProvider)) {
    throw new Error(
      `Invalid SECRETS_PROVIDER "${raw}". Expected one of: ${VALID_PROVIDERS.join(', ')}`
    );
  }

  const provider = raw as SecretsProvider;
  const options: SecretsManagerOptions = { type: provider };

  if (provider === 'infisical') {
    const clientId = process.env.INFISICAL_CLIENT_ID;
    const clientSecret = process.env.INFISICAL_CLIENT_SECRET;
    const projectId = process.env.INFISICAL_PROJECT_ID;
    const environment = process.env.INFISICAL_ENVIRONMENT ?? 'dev';

    if (!clientId || !clientSecret || !projectId) {
      throw new Error(
        'SECRETS_PROVIDER=infisical requires INFISICAL_CLIENT_ID, INFISICAL_CLIENT_SECRET, and INFISICAL_PROJECT_ID environment variables.'
      );
    }

    options.infisical = {
      clientId,
      clientSecret,
      projectId,
      environment,
      secretPath: process.env.INFISICAL_SECRET_PATH ?? '/',
      siteUrl: process.env.INFISICAL_SITE_URL,
    };
  }

  const secretsManager = createSecretsManager(options);

  await preloadSecrets(secretsManager, [...REQUIRED_SECRET_KEYS], {
    attachToEnv: true,
  });

  // 2. Create the NestJS application.
  //    ConfigModule (global) reads the now-populated process.env values.
  const app = await NestFactory.create(AppModule, {
    // Preserve raw body for Stripe webhook signature verification
    rawBody: true,
  });

  // Security headers
  app.use(helmet());

  // CORS
  const corsOrigin = process.env.CORS_ORIGIN ?? 'http://localhost:3001';
  app.enableCors({
    origin: corsOrigin.split(',').map((o) => o.trim()),
    credentials: true,
  });

  // Swagger / OpenAPI (non-production only)
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('EcomSaaS API')
      .setDescription('Multi-vendor e-commerce SaaS platform API')
      .setVersion('0.1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  console.log(`🚀 API running on http://localhost:${String(port)}`);
  console.log(`📚 Swagger docs at http://localhost:${String(port)}/api/docs`);
}

void bootstrap();
