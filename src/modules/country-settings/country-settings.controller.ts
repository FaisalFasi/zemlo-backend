import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { AdminMessageResponseDto } from '../admin/common/dto/admin-message-response.dto';
import { PERMISSIONS } from '../../common/constants/permissions';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CountrySettingsService } from './country-settings.service';
import {
  CountrySettingResponseDto,
  CreateCountrySettingDto,
  UpdateCountrySettingDto,
} from './dto';

@ApiTags('Admin - Country Settings')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('admin/countries')
export class CountrySettingsController {
  constructor(
    private readonly countrySettingsService: CountrySettingsService,
  ) {}

  @Get()
  @RequirePermissions(PERMISSIONS.SETTINGS_VIEW)
  @ApiOperation({ summary: 'Get all country settings' })
  @ApiOkResponse({ type: [CountrySettingResponseDto] })
  findAll() {
    return this.countrySettingsService.findAll();
  }

  @Post()
  @RequirePermissions(PERMISSIONS.SETTINGS_UPDATE)
  @ApiOperation({ summary: 'Create country setting' })
  @ApiCreatedResponse({ type: CountrySettingResponseDto })
  create(@Body() dto: CreateCountrySettingDto) {
    return this.countrySettingsService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.SETTINGS_UPDATE)
  @ApiOperation({ summary: 'Update country setting' })
  @ApiOkResponse({ type: CountrySettingResponseDto })
  update(@Param('id') id: string, @Body() dto: UpdateCountrySettingDto) {
    return this.countrySettingsService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.SETTINGS_UPDATE)
  @ApiOperation({ summary: 'Delete country setting' })
  @ApiOkResponse({ type: AdminMessageResponseDto })
  remove(@Param('id') id: string) {
    return this.countrySettingsService.remove(id);
  }
}
