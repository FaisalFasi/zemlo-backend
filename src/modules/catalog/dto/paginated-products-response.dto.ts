import { ApiProperty } from '@nestjs/swagger';

import { PublicProductListItemResponseDto } from './catalog-product-response.dto';

export class PaginatedProductsResponseDto {
  @ApiProperty({ type: [PublicProductListItemResponseDto] })
  items: PublicProductListItemResponseDto[];

  @ApiProperty({ type: Number, example: 137 })
  total: number;

  @ApiProperty({ type: Number, example: 1 })
  page: number;

  @ApiProperty({ type: Number, example: 24 })
  limit: number;

  @ApiProperty({ type: Number, example: 6 })
  pageCount: number;
}
