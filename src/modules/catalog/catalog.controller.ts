import { Controller, Get, Param } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CatalogService } from './catalog.service';
import {
  PublicBrandResponseDto,
  PublicCategoryResponseDto,
  PublicProductDetailResponseDto,
  PublicProductListItemResponseDto,
} from './dto';

@ApiTags('Catalog')
@Controller()
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('products')
  @ApiOperation({ summary: 'Public: get active products' })
  @ApiOkResponse({ type: [PublicProductListItemResponseDto] })
  findProducts() {
    return this.catalogService.findProducts();
  }

  @Get('products/:slug')
  @ApiOperation({ summary: 'Public: get active product by slug' })
  @ApiOkResponse({ type: PublicProductDetailResponseDto })
  findProductBySlug(@Param('slug') slug: string) {
    return this.catalogService.findProductBySlug(slug);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Public: get active categories' })
  @ApiOkResponse({ type: [PublicCategoryResponseDto] })
  findCategories() {
    return this.catalogService.findCategories();
  }

  @Get('brands')
  @ApiOperation({ summary: 'Public: get active brands' })
  @ApiOkResponse({ type: [PublicBrandResponseDto] })
  findBrands() {
    return this.catalogService.findBrands();
  }
}
