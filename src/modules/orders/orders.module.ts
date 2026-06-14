import { Module } from '@nestjs/common';

import { CheckoutModule } from '../checkout/checkout.module';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [CheckoutModule],
  providers: [OrdersService],
  controllers: [OrdersController],
})
export class OrdersModule {}
