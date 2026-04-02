import { Module } from '@nestjs/common';
import { GetStore, CreateStore, UpdateStore } from '@ecomsaas/application/use-cases';
import { createIdGenerator } from '@ecomsaas/infrastructure/id-generator';
import { StoresController } from './stores.controller';
import { StoresService } from './stores.service';
import { STORE_REPOSITORY } from './store.tokens';
import { SupabaseStoreRepository } from './repositories/supabase-store.repository';

@Module({
  controllers: [StoresController],
  providers: [
    StoresService,
    SupabaseStoreRepository,
    {
      provide: STORE_REPOSITORY,
      useExisting: SupabaseStoreRepository,
    },
    {
      provide: GetStore,
      useFactory: (repo: SupabaseStoreRepository) => new GetStore(repo),
      inject: [SupabaseStoreRepository],
    },
    {
      provide: CreateStore,
      useFactory: (repo: SupabaseStoreRepository) => new CreateStore(repo, createIdGenerator()),
      inject: [SupabaseStoreRepository],
    },
    {
      provide: UpdateStore,
      useFactory: (repo: SupabaseStoreRepository) => new UpdateStore(repo),
      inject: [SupabaseStoreRepository],
    },
  ],
  exports: [StoresService, STORE_REPOSITORY],
})
export class StoresModule {}
