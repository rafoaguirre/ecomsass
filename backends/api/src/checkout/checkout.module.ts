import { Module } from '@nestjs/common';
import { PlaceOrder, ConfirmOrder } from '@ecomsaas/application/use-cases';
import type { ProductRepository, StoreRepository } from '@ecomsaas/application/ports';
import { createIdGenerator } from '@ecomsaas/infrastructure/id-generator';
import { OrdersModule } from '../orders';
import { StoresModule } from '../stores';
import { ProductsModule } from '../products';
import { ORDER_REPOSITORY } from '../orders/order.tokens';
import { STORE_REPOSITORY } from '../stores/store.tokens';
import { PRODUCT_REPOSITORY } from '../products/product.tokens';
import { SupabaseOrderRepository } from '../orders/repositories/supabase-order.repository';
import { CheckoutController } from './checkout.controller';
import { WebhookController } from './webhook.controller';
import { CheckoutService } from './checkout.service';
import { StripePaymentGateway } from './stripe-payment.gateway';
import { SupabaseWebhookEventLog } from './supabase-webhook-event-log';
import { SupabasePaymentRepository } from './supabase-payment.repository';
import { PAYMENT_GATEWAY, WEBHOOK_EVENT_LOG, PAYMENT_REPOSITORY } from './checkout.tokens';

@Module({
  imports: [OrdersModule, StoresModule, ProductsModule],
  controllers: [CheckoutController, WebhookController],
  providers: [
    CheckoutService,
    StripePaymentGateway,
    SupabaseWebhookEventLog,
    SupabasePaymentRepository,
    {
      provide: PAYMENT_GATEWAY,
      useExisting: StripePaymentGateway,
    },
    {
      provide: WEBHOOK_EVENT_LOG,
      useExisting: SupabaseWebhookEventLog,
    },
    {
      provide: PAYMENT_REPOSITORY,
      useExisting: SupabasePaymentRepository,
    },
    {
      provide: PlaceOrder,
      useFactory: (
        orderRepo: SupabaseOrderRepository,
        productRepo: ProductRepository,
        storeRepo: StoreRepository
      ) => new PlaceOrder(orderRepo, productRepo, storeRepo, createIdGenerator()),
      inject: [ORDER_REPOSITORY, PRODUCT_REPOSITORY, STORE_REPOSITORY],
    },
    {
      provide: ConfirmOrder,
      useFactory: (orderRepo: SupabaseOrderRepository) => new ConfirmOrder(orderRepo),
      inject: [ORDER_REPOSITORY],
    },
  ],
})
export class CheckoutModule {}
