import { Module } from '@nestjs/common';
import { CreateProduct, GetProduct, UpdateProduct } from '@ecomsaas/application/use-cases';
import type { StoreRepository } from '@ecomsaas/application/ports';
import { createStorage } from '@ecomsaas/infrastructure/storage';
import { StoresModule } from '../stores';
import { STORE_REPOSITORY } from '../stores/store.tokens';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { PRODUCT_REPOSITORY, PRODUCT_STORAGE } from './product.tokens';
import { SupabaseProductRepository } from './repositories/supabase-product.repository';

@Module({
  imports: [StoresModule],
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
      useFactory: () =>
        createStorage({
          type: process.env.STORAGE_PROVIDER === 's3' ? 's3' : 'memory',
          bucket: process.env.STORAGE_BUCKET ?? '',
          s3: {
            bucket: process.env.STORAGE_BUCKET ?? '',
            region: process.env.STORAGE_REGION ?? 'us-east-1',
            endpoint: process.env.STORAGE_ENDPOINT,
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            forcePathStyle: process.env.STORAGE_FORCE_PATH_STYLE === 'true',
            publicBaseUrl: process.env.STORAGE_PUBLIC_BASE_URL,
          },
        }),
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
