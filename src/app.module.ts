import { ConfigModule } from '@nestjs/config';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import configuration from './config/configuration';
import { validate } from './config/env.config'; // ✅ Yaha se import
import { CheckoutModule } from './modules/checkout/checkout.module';
import { AdminModule } from './modules/admin/admin.module';
import { OrdersModule } from './modules/orders/orders.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate,
      cache: true,
    }),
    PrismaModule,
    AuthModule,
    CheckoutModule,
    AdminModule,
    OrdersModule,
  ], // ConfigModule.forRoot() loads env variables
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
