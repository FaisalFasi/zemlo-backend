import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { CatalogService } from './catalog.service';

@ApiTags('Catalog')
@Controller()
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('products')
  @ApiOperation({ summary: 'Public: get active products' })
  findProducts() {
    return this.catalogService.findProducts();
  }

  @Get('products/:slug')
  @ApiOperation({ summary: 'Public: get active product by slug' })
  findProductBySlug(@Param('slug') slug: string) {
    return this.catalogService.findProductBySlug(slug);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Public: get active categories' })
  findCategories() {
    return this.catalogService.findCategories();
  }

  @Get('brands')
  @ApiOperation({ summary: 'Public: get active brands' })
  findBrands() {
    return this.catalogService.findBrands();
  }
}
