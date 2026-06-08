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

import { PERMISSIONS } from '../../../common/constants/permissions';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { AdminMessageResponseDto } from '../common/dto/admin-message-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ProductVariantsService } from './product-variants.service';
import {
  CreateProductVariantDto,
  ProductVariantResponseDto,
  UpdateProductVariantDto,
} from './dto';

@ApiTags('Admin - Product Variants')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('admin/products/:productId/variants')
export class ProductVariantsController {
  constructor(
    private readonly productVariantsService: ProductVariantsService,
  ) {}

  @Get()
  @RequirePermissions(PERMISSIONS.PRODUCTS_VIEW)
  @ApiOperation({ summary: 'Admin: get product variants' })
  @ApiOkResponse({ type: [ProductVariantResponseDto] })
  findAll(@Param('productId') productId: string) {
    return this.productVariantsService.findAll(productId);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.PRODUCTS_UPDATE)
  @ApiOperation({ summary: 'Admin: create product variant' })
  @ApiCreatedResponse({ type: ProductVariantResponseDto })
  create(
    @Param('productId') productId: string,
    @Body() dto: CreateProductVariantDto,
  ) {
    return this.productVariantsService.create(productId, dto);
  }

  @Patch(':variantId')
  @RequirePermissions(PERMISSIONS.PRODUCTS_UPDATE)
  @ApiOperation({ summary: 'Admin: update product variant' })
  @ApiOkResponse({ type: ProductVariantResponseDto })
  update(
    @Param('productId') productId: string,
    @Param('variantId') variantId: string,
    @Body() dto: UpdateProductVariantDto,
  ) {
    return this.productVariantsService.update(productId, variantId, dto);
  }

  @Delete(':variantId')
  @RequirePermissions(PERMISSIONS.PRODUCTS_UPDATE)
  @ApiOperation({ summary: 'Admin: delete product variant' })
  @ApiOkResponse({ type: AdminMessageResponseDto })
  remove(
    @Param('productId') productId: string,
    @Param('variantId') variantId: string,
  ) {
    return this.productVariantsService.remove(productId, variantId);
  }
}
