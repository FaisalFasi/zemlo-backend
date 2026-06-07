import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductStatus } from '@prisma/client';

export class AdminProductCategoryResponseDto {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String })
  name: string;

  @ApiProperty({ type: String })
  slug: string;
}

export class AdminProductBrandResponseDto {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String })
  name: string;

  @ApiProperty({ type: String })
  slug: string;
}

export class AdminProductImageResponseDto {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String })
  productId: string;

  @ApiProperty({ type: String })
  url: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  altText: string | null;

  @ApiProperty({ type: Number })
  position: number;

  @ApiProperty({ type: Boolean })
  isDefault: boolean;

  @ApiProperty({ type: Date })
  createdAt: Date;

  @ApiProperty({ type: Date })
  updatedAt: Date;
}

export class AdminProductVariantResponseDto {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String })
  productId: string;

  @ApiProperty({ type: String })
  name: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  sku: string | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  price: number | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  compareAtPrice: number | null;

  @ApiProperty({ type: Number })
  stock: number;

  @ApiProperty({ type: Boolean })
  trackInventory: boolean;

  @ApiProperty({ type: Boolean })
  allowBackorder: boolean;

  @ApiPropertyOptional({ type: String, nullable: true })
  image: string | null;

  @ApiProperty({ type: Object })
  options: unknown;

  @ApiProperty({ type: Boolean })
  isActive: boolean;

  @ApiProperty({ type: Date })
  createdAt: Date;

  @ApiProperty({ type: Date })
  updatedAt: Date;
}

export class AdminProductResponseDto {
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

  @ApiPropertyOptional({ type: Number, nullable: true })
  costPrice: number | null;

  @ApiProperty({ type: Number })
  stock: number;

  @ApiProperty({ type: Boolean })
  trackInventory: boolean;

  @ApiProperty({ type: Boolean })
  allowBackorder: boolean;

  @ApiProperty({ type: Boolean })
  hasVariants: boolean;

  @ApiProperty({ enum: ProductStatus })
  status: ProductStatus;

  @ApiProperty({ type: Boolean })
  isFeatured: boolean;

  @ApiProperty({ type: String })
  categoryId: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  brandId: string | null;

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

  @ApiPropertyOptional({ type: Date, nullable: true })
  publishedAt: Date | null;

  @ApiProperty({ type: AdminProductCategoryResponseDto })
  category: AdminProductCategoryResponseDto;

  @ApiPropertyOptional({ type: AdminProductBrandResponseDto, nullable: true })
  brand: AdminProductBrandResponseDto | null;

  @ApiProperty({ type: [AdminProductImageResponseDto] })
  images: AdminProductImageResponseDto[];

  @ApiProperty({ type: [AdminProductVariantResponseDto] })
  variants: AdminProductVariantResponseDto[];

  @ApiProperty({ type: Date })
  createdAt: Date;

  @ApiProperty({ type: Date })
  updatedAt: Date;
}
