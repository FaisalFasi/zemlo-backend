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

import { AdminProductsService } from './admin-products.service';
import { CreateAdminProductDto, UpdateAdminProductDto } from './dto';

@ApiTags('Admin - Products')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin/products')
export class AdminProductsController {
  constructor(private readonly adminProductsService: AdminProductsService) {}

  @Get()
  @ApiOperation({ summary: 'Admin: get all products' })
  findAll() {
    return this.adminProductsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Admin: get product by ID' })
  findOne(@Param('id') id: string) {
    return this.adminProductsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Admin: create product' })
  create(@Body() dto: CreateAdminProductDto) {
    return this.adminProductsService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Admin: update product' })
  update(@Param('id') id: string, @Body() dto: UpdateAdminProductDto) {
    return this.adminProductsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Admin: archive product' })
  archive(@Param('id') id: string) {
    return this.adminProductsService.archive(id);
  }
}
