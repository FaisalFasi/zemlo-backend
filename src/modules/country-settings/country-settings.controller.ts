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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../common/guards/admin.guard';

import { CountrySettingsService } from './country-settings.service';
import { CreateCountrySettingDto, UpdateCountrySettingDto } from './dto';

@ApiTags('Admin - Country Settings')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin/countries')
export class CountrySettingsController {
  constructor(
    private readonly countrySettingsService: CountrySettingsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all country settings' })
  findAll() {
    return this.countrySettingsService.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'Create country setting' })
  create(@Body() dto: CreateCountrySettingDto) {
    return this.countrySettingsService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update country setting' })
  update(@Param('id') id: string, @Body() dto: UpdateCountrySettingDto) {
    return this.countrySettingsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete country setting' })
  remove(@Param('id') id: string) {
    return this.countrySettingsService.remove(id);
  }
}
