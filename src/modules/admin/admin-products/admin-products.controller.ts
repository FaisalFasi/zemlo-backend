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
import { AdminProductsService } from './admin-products.service';
import {
  AdminProductResponseDto,
  CreateAdminProductDto,
  UpdateAdminProductDto,
} from './dto';

@ApiTags('Admin - Products')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('admin/products')
export class AdminProductsController {
  constructor(private readonly adminProductsService: AdminProductsService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.PRODUCTS_VIEW)
  @ApiOperation({ summary: 'Admin: get all products' })
  @ApiOkResponse({ type: [AdminProductResponseDto] })
  findAll() {
    return this.adminProductsService.findAll();
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.PRODUCTS_VIEW)
  @ApiOperation({ summary: 'Admin: get product by ID' })
  @ApiOkResponse({ type: AdminProductResponseDto })
  findOne(@Param('id') id: string) {
    return this.adminProductsService.findOne(id);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.PRODUCTS_CREATE)
  @ApiOperation({ summary: 'Admin: create product' })
  @ApiCreatedResponse({ type: AdminProductResponseDto })
  create(@Body() dto: CreateAdminProductDto) {
    return this.adminProductsService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.PRODUCTS_UPDATE)
  @ApiOperation({ summary: 'Admin: update product' })
  @ApiOkResponse({ type: AdminProductResponseDto })
  update(@Param('id') id: string, @Body() dto: UpdateAdminProductDto) {
    return this.adminProductsService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.PRODUCTS_DELETE)
  @ApiOperation({ summary: 'Admin: archive product' })
  @ApiOkResponse({ type: AdminMessageResponseDto })
  archive(@Param('id') id: string) {
    return this.adminProductsService.archive(id);
  }
}
