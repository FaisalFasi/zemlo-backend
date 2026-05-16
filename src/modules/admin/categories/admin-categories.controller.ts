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

import { AdminCategoriesService } from './admin-categories.service';
import { CreateAdminCategoryDto, UpdateAdminCategoryDto } from './dto';

@ApiTags('Admin - Categories')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin/categories')
export class AdminCategoriesController {
  constructor(
    private readonly adminCategoriesService: AdminCategoriesService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Admin: get all categories' })
  findAll() {
    return this.adminCategoriesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Admin: get category by ID' })
  findOne(@Param('id') id: string) {
    return this.adminCategoriesService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Admin: create category' })
  create(@Body() dto: CreateAdminCategoryDto) {
    return this.adminCategoriesService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Admin: update category' })
  update(@Param('id') id: string, @Body() dto: UpdateAdminCategoryDto) {
    return this.adminCategoriesService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Admin: disable category' })
  disable(@Param('id') id: string) {
    return this.adminCategoriesService.disable(id);
  }
}
