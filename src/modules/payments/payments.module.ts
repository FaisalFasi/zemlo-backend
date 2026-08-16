import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { PrismaModule } from '../../prisma/prisma.module';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { StripeService } from './services/stripe.service';
import { ExpiredReservationReleaseService } from './services/expired-reservation-release.service';
import { InventoryReleaseCron } from './services/inventory-release.cron';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [ConfigModule, PrismaModule, OrdersModule],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    StripeService,
    ExpiredReservationReleaseService,
    InventoryReleaseCron,
  ],
  exports: [PaymentsService, ExpiredReservationReleaseService],
})
export class PaymentsModule {}
