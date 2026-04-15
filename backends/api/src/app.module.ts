import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth';
import { BullBoardModule } from './bull-board';
import { CheckoutModule } from './checkout';
import { EmailModule } from './email';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { DatabaseModule } from './database';
import { HealthModule } from './health/health.module';
import { OnboardingModule } from './onboarding';
import { RedisModule } from './redis';
import { StoresModule } from './stores';
import { ProductsModule } from './products';
import { OrdersModule } from './orders';
import { UsersModule } from './users';
import { VendorsModule } from './vendors';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        { name: 'default', ttl: 60_000, limit: 60 },
        { name: 'strict', ttl: 60_000, limit: 10 },
      ],
    }),
    AuthModule,
    DatabaseModule,
    RedisModule,
    EmailModule,
    HealthModule,
    OnboardingModule,
    StoresModule,
    ProductsModule,
    OrdersModule,
    CheckoutModule,
    UsersModule,
    VendorsModule,
    BullBoardModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
