import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import {
  PublicBrandSummaryResponseDto,
  PublicCategorySummaryResponseDto,
  PublicProductImageResponseDto,
  PublicProductVariantResponseDto,
} from './catalog-common-response.dto';

export class PublicBrandDetailResponseDto extends PublicBrandSummaryResponseDto {
  @ApiPropertyOptional({ type: String, nullable: true })
  description: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  website: string | null;
}

export class PublicProductListItemResponseDto {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String })
  name: string;

  @ApiProperty({ type: String })
  slug: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  shortDescription: string | null;

  @ApiProperty({ type: Number })
  price: number;

  @ApiPropertyOptional({ type: Number, nullable: true })
  compareAtPrice: number | null;

  @ApiProperty({ type: Number })
  stock: number;

  @ApiProperty({ type: Boolean })
  trackInventory: boolean;

  @ApiProperty({ type: Boolean })
  allowBackorder: boolean;

  @ApiProperty({ type: Boolean })
  hasVariants: boolean;

  @ApiProperty({ type: Boolean })
  isFeatured: boolean;

  @ApiProperty({ type: [String] })
  keywords: string[];

  @ApiPropertyOptional({ type: String, nullable: true })
  metaTitle: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
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
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String })
  name: string;

  @ApiProperty({ type: String })
  slug: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  description: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  shortDescription: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  sku: string | null;

  @ApiProperty({ type: Number })
  price: number;

  @ApiPropertyOptional({ type: Number, nullable: true })
  compareAtPrice: number | null;

  @ApiProperty({ type: Number })
  stock: number;

  @ApiProperty({ type: Boolean })
  trackInventory: boolean;

  @ApiProperty({ type: Boolean })
  allowBackorder: boolean;

  @ApiProperty({ type: Boolean })
  hasVariants: boolean;

  @ApiProperty({ type: Boolean })
  isFeatured: boolean;

  @ApiPropertyOptional({ type: Number, nullable: true })
  weight: number | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  length: number | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  width: number | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  height: number | null;

  @ApiProperty({ type: [String] })
  keywords: string[];

  @ApiPropertyOptional({ type: String, nullable: true })
  metaTitle: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
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
