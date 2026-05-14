import { Module } from '@nestjs/common';
import { CheckoutController } from './checkout.controller';
import { CheckoutService } from './checkout.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { CheckoutSettingsService } from './services/checkout-settings.service';
import { CheckoutPricingService } from './services/checkout-pricing.service';
import { CheckoutInventoryService } from './services/checkout-inventory.service';
import { CheckoutAddressService } from './services/checkout-address.service';
import { CheckoutOrderService } from './services/checkout-order.service';
import { CheckoutAvailabilityService } from './services/checkout.availability.service';

@Module({
  imports: [PrismaModule],
  controllers: [CheckoutController],
  providers: [
    CheckoutService,
    CheckoutSettingsService,
    CheckoutPricingService,
    CheckoutInventoryService,
    CheckoutAddressService,
    CheckoutOrderService,
    CheckoutAvailabilityService,
  ],
  exports: [CheckoutService],
})
export class CheckoutModule {}
