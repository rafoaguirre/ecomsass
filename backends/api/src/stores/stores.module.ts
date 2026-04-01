import { Module } from '@nestjs/common';
import { GetStore } from '@ecomsaas/application/use-cases';
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
      useFactory: (storeRepository: SupabaseStoreRepository) => new GetStore(storeRepository),
      inject: [SupabaseStoreRepository],
    },
  ],
  exports: [StoresService],
})
export class StoresModule {}
