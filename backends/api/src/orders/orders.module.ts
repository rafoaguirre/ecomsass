import { Module } from '@nestjs/common';
import {
  PlaceOrder,
  GetOrder,
  ListOrders,
  UpdateOrderStatus,
} from '@ecomsaas/application/use-cases';
import type { ProductRepository, StoreRepository } from '@ecomsaas/application/ports';
import { createIdGenerator } from '@ecomsaas/infrastructure/id-generator';
import { StoresModule } from '../stores';
import { ProductsModule } from '../products';
import { STORE_REPOSITORY } from '../stores/store.tokens';
import { PRODUCT_REPOSITORY } from '../products/product.tokens';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { ORDER_REPOSITORY } from './order.tokens';
import { SupabaseOrderRepository } from './repositories/supabase-order.repository';

@Module({
  imports: [StoresModule, ProductsModule],
  controllers: [OrdersController],
  providers: [
    OrdersService,
    SupabaseOrderRepository,
    {
      provide: ORDER_REPOSITORY,
      useExisting: SupabaseOrderRepository,
    },
    {
      provide: PlaceOrder,
      useFactory: (
        orderRepo: SupabaseOrderRepository,
        productRepo: ProductRepository,
        storeRepo: StoreRepository
      ) => new PlaceOrder(orderRepo, productRepo, storeRepo, createIdGenerator()),
      inject: [SupabaseOrderRepository, PRODUCT_REPOSITORY, STORE_REPOSITORY],
    },
    {
      provide: GetOrder,
      useFactory: (repo: SupabaseOrderRepository) => new GetOrder(repo),
      inject: [SupabaseOrderRepository],
    },
    {
      provide: ListOrders,
      useFactory: (repo: SupabaseOrderRepository) => new ListOrders(repo),
      inject: [SupabaseOrderRepository],
    },
    {
      provide: UpdateOrderStatus,
      useFactory: (repo: SupabaseOrderRepository) => new UpdateOrderStatus(repo),
      inject: [SupabaseOrderRepository],
    },
  ],
  exports: [OrdersService, ORDER_REPOSITORY],
})
export class OrdersModule {}
