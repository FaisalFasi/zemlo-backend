import { Module } from '@nestjs/common';
import { CountrySettingsController } from './country-settings.controller';
import { CountrySettingsService } from './country-settings.service';

@Module({
  controllers: [CountrySettingsController],
  providers: [CountrySettingsService],
})
export class CountrySettingsModule {}
