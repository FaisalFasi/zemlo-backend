import { Module } from '@nestjs/common';

import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { OrderInventoryLifecycleService } from './services/order-inventory-lifecycle.service';

@Module({
  providers: [OrdersService, OrderInventoryLifecycleService],
  controllers: [OrdersController],
  exports: [OrdersService, OrderInventoryLifecycleService],
})
export class OrdersModule {}
