import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export const CATALOG_SORT_OPTIONS = [
  'featured',
  'newest',
  'price-asc',
  'price-desc',
] as const;

export type CatalogSortOption = (typeof CATALOG_SORT_OPTIONS)[number];

export class CatalogQueryDto {
  @ApiPropertyOptional({ type: Number, example: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    type: Number,
    example: 24,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 24;

  @ApiPropertyOptional({ type: String, example: 'candle' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    type: String,
    example: 'home-decor',
    description: 'category slug',
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    type: String,
    example: 'zemlo',
    description: 'brand slug',
  })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional({ enum: CATALOG_SORT_OPTIONS, example: 'newest' })
  @IsOptional()
  @IsIn(CATALOG_SORT_OPTIONS)
  sort?: CatalogSortOption = 'featured';
}
