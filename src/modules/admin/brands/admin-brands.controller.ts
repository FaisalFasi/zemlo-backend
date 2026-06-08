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

import { AdminMessageResponseDto } from '../common/dto/admin-message-response.dto';
import { PERMISSIONS } from '../../../common/constants/permissions';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AdminBrandsService } from './admin-brands.service';
import {
  AdminBrandResponseDto,
  CreateAdminBrandDto,
  UpdateAdminBrandDto,
} from './dto';

@ApiTags('Admin - Brands')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('admin/brands')
export class AdminBrandsController {
  constructor(private readonly adminBrandsService: AdminBrandsService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.BRANDS_VIEW)
  @ApiOperation({ summary: 'Admin: get all brands' })
  @ApiOkResponse({ type: [AdminBrandResponseDto] })
  findAll() {
    return this.adminBrandsService.findAll();
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.BRANDS_VIEW)
  @ApiOperation({ summary: 'Admin: get brand by ID' })
  @ApiOkResponse({ type: AdminBrandResponseDto })
  findOne(@Param('id') id: string) {
    return this.adminBrandsService.findOne(id);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.BRANDS_CREATE)
  @ApiOperation({ summary: 'Admin: create brand' })
  @ApiCreatedResponse({ type: AdminBrandResponseDto })
  create(@Body() dto: CreateAdminBrandDto) {
    return this.adminBrandsService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.BRANDS_UPDATE)
  @ApiOperation({ summary: 'Admin: update brand' })
  @ApiOkResponse({ type: AdminBrandResponseDto })
  update(@Param('id') id: string, @Body() dto: UpdateAdminBrandDto) {
    return this.adminBrandsService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.BRANDS_DELETE)
  @ApiOperation({ summary: 'Admin: disable brand' })
  @ApiOkResponse({ type: AdminMessageResponseDto })
  disable(@Param('id') id: string) {
    return this.adminBrandsService.disable(id);
  }
}
