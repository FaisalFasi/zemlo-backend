import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import {
  PublicBrandSummaryResponseDto,
  PublicCategorySummaryResponseDto,
  PublicProductImageResponseDto,
  PublicProductVariantResponseDto,
} from './catalog-common-response.dto';

export class PublicBrandDetailResponseDto extends PublicBrandSummaryResponseDto {
  @ApiPropertyOptional({ nullable: true })
  description: string | null;

  @ApiPropertyOptional({ nullable: true })
  website: string | null;
}

export class PublicProductListItemResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiPropertyOptional({ nullable: true })
  shortDescription: string | null;

  @ApiProperty()
  price: number;

  @ApiPropertyOptional({ nullable: true })
  compareAtPrice: number | null;

  @ApiProperty()
  stock: number;

  @ApiProperty()
  trackInventory: boolean;

  @ApiProperty()
  allowBackorder: boolean;

  @ApiProperty()
  hasVariants: boolean;

  @ApiProperty()
  isFeatured: boolean;

  @ApiProperty({ type: [String] })
  keywords: string[];

  @ApiPropertyOptional({ nullable: true })
  metaTitle: string | null;

  @ApiPropertyOptional({ nullable: true })
  metaDescription: string | null;

  @ApiProperty({ type: PublicCategorySummaryResponseDto })
  category: PublicCategorySummaryResponseDto;

  @ApiPropertyOptional({ type: PublicBrandSummaryResponseDto, nullable: true })
  brand: PublicBrandSummaryResponseDto | null;

  @ApiProperty({ type: [PublicProductImageResponseDto] })
  images: PublicProductImageResponseDto[];

  @ApiProperty({ type: [PublicProductVariantResponseDto] })
  variants: PublicProductVariantResponseDto[];
}

export class PublicProductDetailResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiPropertyOptional({ nullable: true })
  description: string | null;

  @ApiPropertyOptional({ nullable: true })
  shortDescription: string | null;

  @ApiPropertyOptional({ nullable: true })
  sku: string | null;

  @ApiProperty()
  price: number;

  @ApiPropertyOptional({ nullable: true })
  compareAtPrice: number | null;

  @ApiProperty()
  stock: number;

  @ApiProperty()
  trackInventory: boolean;

  @ApiProperty()
  allowBackorder: boolean;

  @ApiProperty()
  hasVariants: boolean;

  @ApiProperty()
  isFeatured: boolean;

  @ApiPropertyOptional({ nullable: true })
  weight: number | null;

  @ApiPropertyOptional({ nullable: true })
  length: number | null;

  @ApiPropertyOptional({ nullable: true })
  width: number | null;

  @ApiPropertyOptional({ nullable: true })
  height: number | null;

  @ApiProperty({ type: [String] })
  keywords: string[];

  @ApiPropertyOptional({ nullable: true })
  metaTitle: string | null;

  @ApiPropertyOptional({ nullable: true })
  metaDescription: string | null;

  @ApiProperty({ type: PublicCategorySummaryResponseDto })
  category: PublicCategorySummaryResponseDto;

  @ApiPropertyOptional({ type: PublicBrandDetailResponseDto, nullable: true })
  brand: PublicBrandDetailResponseDto | null;

  @ApiProperty({ type: [PublicProductImageResponseDto] })
  images: PublicProductImageResponseDto[];

  @ApiProperty({ type: [PublicProductVariantResponseDto] })
  variants: PublicProductVariantResponseDto[];
}
