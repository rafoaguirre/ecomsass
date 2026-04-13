import { Module } from '@nestjs/common';
import { ConfirmOrder } from '@ecomsaas/application/use-cases';
import { OrdersModule } from '../orders';
import { StoresModule } from '../stores';
import { ProductsModule } from '../products';
import { ORDER_REPOSITORY } from '../orders/order.tokens';
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
      provide: ConfirmOrder,
      useFactory: (orderRepo: SupabaseOrderRepository) => new ConfirmOrder(orderRepo),
      inject: [ORDER_REPOSITORY],
    },
  ],
})
export class CheckoutModule {}
