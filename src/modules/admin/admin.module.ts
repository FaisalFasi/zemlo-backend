import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { PlatformSettingsModule } from './platform-settings/platform-settings.module';
import { CountrySettingsModule } from '../country-settings/country-settings.module';

@Module({
  imports: [PlatformSettingsModule, CountrySettingsModule],
  providers: [AdminService],
  controllers: [AdminController],
})
export class AdminModule {}
