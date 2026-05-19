import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../../common/guards/admin.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../../common/types/authenticated-user.type';

import { PlatformSettingsService } from './platform-settings.service';
import { UpdatePlatformSettingsDto } from './dto';

@ApiTags('Admin - Platform Settings')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin/platform-settings')
export class PlatformSettingsController {
  constructor(
    private readonly platformSettingsService: PlatformSettingsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get platform settings' })
  getSettings() {
    return this.platformSettingsService.getSettings();
  }

  @Patch()
  @ApiOperation({ summary: 'Update platform settings' })
  updateSettings(
    @Body() dto: UpdatePlatformSettingsDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.platformSettingsService.updateSettings(dto, user.id);
  }
}
