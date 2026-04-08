import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { DatabaseModule } from './database';
import { HealthModule } from './health/health.module';
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
      throttlers: [{ ttl: 60_000, limit: 60 }],
    }),
    AuthModule,
    DatabaseModule,
    HealthModule,
    StoresModule,
    ProductsModule,
    OrdersModule,
    UsersModule,
    VendorsModule,
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
