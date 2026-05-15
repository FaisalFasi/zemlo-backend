import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { PlatformSettingsModule } from './platform-settings/platform-settings.module';
import { CountrySettingsModule } from '../country-settings/country-settings.module';
import { PaymentSettingsModule } from './payment-settings/payment-settings.module';
import { AdminProductsModule } from './admin-products/admin-products.module';

@Module({
  imports: [
    PlatformSettingsModule,
    CountrySettingsModule,
    PaymentSettingsModule,
    AdminProductsModule,
  ],
  providers: [AdminService],
  controllers: [AdminController],
})
export class AdminModule {}
