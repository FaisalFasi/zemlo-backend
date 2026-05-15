import { Module } from '@nestjs/common';
import { PublicSettingsService } from './public-settings.service';
import { PublicSettingsController } from './public-settings.controller';

@Module({
  controllers: [PublicSettingsController],
  providers: [PublicSettingsService],
})
export class PublicSettingsModule {}
