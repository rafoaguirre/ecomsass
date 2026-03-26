import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { createSecretsManager, preloadSecrets } from '@ecomsaas/infrastructure/secrets';
import { AppModule } from './app.module';
import { REQUIRED_SECRET_KEYS } from './config';

async function bootstrap() {
  // 1. Resolve required secrets into process.env before NestJS boots.
  //    In local dev this reads from .env via EnvSecretsManager.
  //    In production, set SECRETS_PROVIDER=infisical to use Infisical.
  const VALID_PROVIDERS = ['env', 'infisical'] as const;
  type SecretsProvider = (typeof VALID_PROVIDERS)[number];
  const raw = process.env.SECRETS_PROVIDER ?? 'env';

  if (!VALID_PROVIDERS.includes(raw as SecretsProvider)) {
    throw new Error(
      `Invalid SECRETS_PROVIDER "${raw}". Expected one of: ${VALID_PROVIDERS.join(', ')}`
    );
  }

  const secretsManager = createSecretsManager({
    type: raw as SecretsProvider,
  });

  await preloadSecrets(secretsManager, [...REQUIRED_SECRET_KEYS], {
    attachToEnv: true,
  });

  // 2. Create the NestJS application.
  //    ConfigModule (global) reads the now-populated process.env values.
  const app = await NestFactory.create(AppModule);

  // Swagger / OpenAPI
  const config = new DocumentBuilder()
    .setTitle('EcomSaaS API')
    .setDescription('Multi-vendor e-commerce SaaS platform API')
    .setVersion('0.1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  console.log(`🚀 API running on http://localhost:${String(port)}`);
  console.log(`📚 Swagger docs at http://localhost:${String(port)}/api/docs`);
}

void bootstrap();
