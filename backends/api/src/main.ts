import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
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
