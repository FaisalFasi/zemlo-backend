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

import { ProductVariantsService } from './product-variants.service';
import { CreateProductVariantDto, UpdateProductVariantDto } from './dto';

@ApiTags('Admin - Product Variants')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin/products/:productId/variants')
export class ProductVariantsController {
  constructor(
    private readonly productVariantsService: ProductVariantsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Admin: get product variants' })
  findAll(@Param('productId') productId: string) {
    return this.productVariantsService.findAll(productId);
  }

  @Post()
  @ApiOperation({ summary: 'Admin: create product variant' })
  create(
    @Param('productId') productId: string,
    @Body() dto: CreateProductVariantDto,
  ) {
    return this.productVariantsService.create(productId, dto);
  }

  @Patch(':variantId')
  @ApiOperation({ summary: 'Admin: update product variant' })
  update(
    @Param('productId') productId: string,
    @Param('variantId') variantId: string,
    @Body() dto: UpdateProductVariantDto,
  ) {
    return this.productVariantsService.update(productId, variantId, dto);
  }

  @Delete(':variantId')
  @ApiOperation({ summary: 'Admin: delete product variant' })
  remove(
    @Param('productId') productId: string,
    @Param('variantId') variantId: string,
  ) {
    return this.productVariantsService.remove(productId, variantId);
  }
}
