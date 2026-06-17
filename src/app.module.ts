import { ConfigModule, ConfigService } from '@nestjs/config';
import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import configuration from './config/configuration';
import { CheckoutModule } from './modules/checkout/checkout.module';
import { AdminModule } from './modules/admin/admin.module';
import { OrdersModule } from './modules/orders/orders.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { PublicSettingsModule } from './modules/public-settings/public-settings.module';
import { CartModule } from './modules/cart/cart.module';
import { PaymentsModule } from './modules/payments/payments.module';

import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

import { validate } from './config/env.config'; // ✅ Yaha se import

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate,
      cache: true,
    }),

    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => [
        {
          name: 'default',
          ttl: configService.get<number>('security.rateLimit.ttlMs', 60_000),
          limit: configService.get<number>('security.rateLimit.max', 120),
        },
      ],
    }),

    PrismaModule,
    AuthModule,
    CheckoutModule,
    AdminModule,
    OrdersModule,
    CatalogModule,
    PublicSettingsModule,
    CartModule,
    PaymentsModule,
  ], // ConfigModule.forRoot() loads env variables
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
