import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { PublicSettingsService } from './public-settings.service';

@ApiTags('Public Settings')
@Controller('public/settings')
export class PublicSettingsController {
  constructor(private readonly publicSettingsService: PublicSettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Public: get store settings' })
  getPublicSettings() {
    return this.publicSettingsService.getPublicSettings();
  }
}
