import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreateProduct, GetProduct, UpdateProduct } from '@ecomsaas/application/use-cases';
import type { StoreRepository } from '@ecomsaas/application/ports';
import { createStorage } from '@ecomsaas/infrastructure/storage';
import { StoresModule } from '../stores';
import { OwnershipModule } from '../common/authorization';
import { STORE_REPOSITORY } from '../stores/store.tokens';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { PRODUCT_REPOSITORY, PRODUCT_STORAGE } from './product.tokens';
import { SupabaseProductRepository } from './repositories/supabase-product.repository';

@Module({
  imports: [StoresModule, OwnershipModule],
  controllers: [ProductsController],
  providers: [
    ProductsService,
    SupabaseProductRepository,
    {
      provide: PRODUCT_REPOSITORY,
      useExisting: SupabaseProductRepository,
    },
    {
      provide: PRODUCT_STORAGE,
      useFactory: (config: ConfigService) =>
        createStorage({
          type: config.get('STORAGE_PROVIDER') === 's3' ? 's3' : 'memory',
          bucket: config.get('STORAGE_BUCKET', ''),
          s3: {
            bucket: config.get('STORAGE_BUCKET', ''),
            region: config.get('STORAGE_REGION', 'us-east-1'),
            endpoint: config.get('STORAGE_ENDPOINT'),
            accessKeyId: config.get('AWS_ACCESS_KEY_ID'),
            secretAccessKey: config.get('AWS_SECRET_ACCESS_KEY'),
            forcePathStyle: config.get('STORAGE_FORCE_PATH_STYLE') === 'true',
            publicBaseUrl: config.get('STORAGE_PUBLIC_BASE_URL'),
          },
        }),
      inject: [ConfigService],
    },
    {
      provide: GetProduct,
      useFactory: (repo: SupabaseProductRepository) => new GetProduct(repo),
      inject: [SupabaseProductRepository],
    },
    {
      provide: CreateProduct,
      useFactory: (repo: SupabaseProductRepository, storeRepo: StoreRepository) =>
        new CreateProduct(repo, storeRepo),
      inject: [SupabaseProductRepository, STORE_REPOSITORY],
    },
    {
      provide: UpdateProduct,
      useFactory: (repo: SupabaseProductRepository) => new UpdateProduct(repo),
      inject: [SupabaseProductRepository],
    },
  ],
  exports: [ProductsService, PRODUCT_REPOSITORY],
})
export class ProductsModule {}
