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

import { PERMISSIONS } from '../../../common/constants/permissions';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AdminCategoriesService } from './admin-categories.service';
import { CreateAdminCategoryDto, UpdateAdminCategoryDto } from './dto';

@ApiTags('Admin - Categories')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('admin/categories')
export class AdminCategoriesController {
  constructor(
    private readonly adminCategoriesService: AdminCategoriesService,
  ) {}

  @Get()
  @RequirePermissions(PERMISSIONS.CATEGORIES_VIEW)
  @ApiOperation({ summary: 'Admin: get all categories' })
  findAll() {
    return this.adminCategoriesService.findAll();
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.CATEGORIES_VIEW)
  @ApiOperation({ summary: 'Admin: get category by ID' })
  findOne(@Param('id') id: string) {
    return this.adminCategoriesService.findOne(id);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.CATEGORIES_CREATE)
  @ApiOperation({ summary: 'Admin: create category' })
  create(@Body() dto: CreateAdminCategoryDto) {
    return this.adminCategoriesService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.CATEGORIES_UPDATE)
  @ApiOperation({ summary: 'Admin: update category' })
  update(@Param('id') id: string, @Body() dto: UpdateAdminCategoryDto) {
    return this.adminCategoriesService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.CATEGORIES_DELETE)
  @ApiOperation({ summary: 'Admin: disable category' })
  disable(@Param('id') id: string) {
    return this.adminCategoriesService.disable(id);
  }
}
