import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { PublicSettingsResponseDto } from './dto';
import { PublicSettingsService } from './public-settings.service';

@ApiTags('Public Settings')
@Controller('public/settings')
export class PublicSettingsController {
  constructor(private readonly publicSettingsService: PublicSettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Public: get store settings' })
  @ApiOkResponse({ type: PublicSettingsResponseDto })
  getPublicSettings() {
    return this.publicSettingsService.getPublicSettings();
  }
}
