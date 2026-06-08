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
import { ProductImagesService } from './product-images.service';
import {
  CreateProductImageDto,
  ProductImageResponseDto,
  UpdateProductImageDto,
} from './dto';

@ApiTags('Admin - Product Images')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('admin/products/:productId/images')
export class ProductImagesController {
  constructor(private readonly productImagesService: ProductImagesService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.PRODUCTS_VIEW)
  @ApiOperation({ summary: 'Admin: get product images' })
  @ApiOkResponse({ type: [ProductImageResponseDto] })
  findAll(@Param('productId') productId: string) {
    return this.productImagesService.findAll(productId);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.PRODUCTS_UPDATE)
  @ApiOperation({ summary: 'Admin: add product image' })
  @ApiCreatedResponse({ type: ProductImageResponseDto })
  create(
    @Param('productId') productId: string,
    @Body() dto: CreateProductImageDto,
  ) {
    return this.productImagesService.create(productId, dto);
  }

  @Patch(':imageId')
  @RequirePermissions(PERMISSIONS.PRODUCTS_UPDATE)
  @ApiOperation({ summary: 'Admin: update product image' })
  @ApiOkResponse({ type: ProductImageResponseDto })
  update(
    @Param('productId') productId: string,
    @Param('imageId') imageId: string,
    @Body() dto: UpdateProductImageDto,
  ) {
    return this.productImagesService.update(productId, imageId, dto);
  }

  @Patch(':imageId/default')
  @RequirePermissions(PERMISSIONS.PRODUCTS_UPDATE)
  @ApiOperation({ summary: 'Admin: set product image as default' })
  @ApiOkResponse({ type: ProductImageResponseDto })
  setDefault(
    @Param('productId') productId: string,
    @Param('imageId') imageId: string,
  ) {
    return this.productImagesService.setDefault(productId, imageId);
  }

  @Delete(':imageId')
  @RequirePermissions(PERMISSIONS.PRODUCTS_UPDATE)
  @ApiOperation({ summary: 'Admin: delete product image' })
  @ApiOkResponse({ type: AdminMessageResponseDto })
  remove(
    @Param('productId') productId: string,
    @Param('imageId') imageId: string,
  ) {
    return this.productImagesService.remove(productId, imageId);
  }
}
