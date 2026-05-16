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

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../../common/guards/admin.guard';

import { AdminBrandsService } from './admin-brands.service';
import { CreateAdminBrandDto, UpdateAdminBrandDto } from './dto';

@ApiTags('Admin - Brands')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin/brands')
export class AdminBrandsController {
  constructor(private readonly adminBrandsService: AdminBrandsService) {}

  @Get()
  @ApiOperation({ summary: 'Admin: get all brands' })
  findAll() {
    return this.adminBrandsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Admin: get brand by ID' })
  findOne(@Param('id') id: string) {
    return this.adminBrandsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Admin: create brand' })
  create(@Body() dto: CreateAdminBrandDto) {
    return this.adminBrandsService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Admin: update brand' })
  update(@Param('id') id: string, @Body() dto: UpdateAdminBrandDto) {
    return this.adminBrandsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Admin: disable brand' })
  disable(@Param('id') id: string) {
    return this.adminBrandsService.disable(id);
  }
}
