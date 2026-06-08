import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { PERMISSIONS } from '../../../common/constants/permissions';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import type { AuthenticatedUser } from '../../../common/types/authenticated-user.type';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PlatformSettingsResponseDto, UpdatePlatformSettingsDto } from './dto';
import { PlatformSettingsService } from './platform-settings.service';

@ApiTags('Admin - Platform Settings')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('admin/platform-settings')
export class PlatformSettingsController {
  constructor(
    private readonly platformSettingsService: PlatformSettingsService,
  ) {}

  @Get()
  @RequirePermissions(PERMISSIONS.SETTINGS_VIEW)
  @ApiOperation({ summary: 'Get platform settings' })
  @ApiOkResponse({ type: PlatformSettingsResponseDto })
  getSettings() {
    return this.platformSettingsService.getSettings();
  }

  @Patch()
  @RequirePermissions(PERMISSIONS.SETTINGS_UPDATE)
  @ApiOperation({ summary: 'Update platform settings' })
  @ApiOkResponse({ type: PlatformSettingsResponseDto })
  updateSettings(
    @Body() dto: UpdatePlatformSettingsDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.platformSettingsService.updateSettings(dto, user.id);
  }
}
