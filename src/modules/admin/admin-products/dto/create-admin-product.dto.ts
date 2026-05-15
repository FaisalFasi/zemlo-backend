import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Min,
} from 'class-validator';

export class CreateAdminProductImageDto {
  @ApiProperty({
    example: 'https://placehold.co/600x600?text=Product',
  })
  @IsString()
  @Length(5, 1000)
  url: string;

  @ApiPropertyOptional({
    example: 'Black hoodie front image',
  })
  @IsOptional()
  @IsString()
  @Length(2, 200)
  altText?: string;

  @ApiPropertyOptional({
    example: 1,
    default: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  position?: number;

  @ApiPropertyOptional({
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class CreateAdminProductDto {
  @ApiProperty({
    example: 'Black Hoodie',
  })
  @IsString()
  @Length(2, 200)
  name: string;

  @ApiPropertyOptional({
    example: 'black-hoodie',
    description:
      'Optional. If not provided, backend will generate it from name.',
  })
  @IsOptional()
  @IsString()
  @Length(2, 220)
  slug?: string;

  @ApiPropertyOptional({
    example: 'Premium black hoodie for everyday wear.',
  })
  @IsOptional()
  @IsString()
  @Length(2, 5000)
  description?: string;

  @ApiPropertyOptional({
    example: 'Premium black hoodie',
  })
  @IsOptional()
  @IsString()
  @Length(2, 500)
  shortDescription?: string;

  @ApiPropertyOptional({
    example: 'HOODIE-BLACK-001',
  })
  @IsOptional()
  @IsString()
  @Length(2, 100)
  sku?: string;

  @ApiProperty({
    example: 49.99,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({
    example: 69.99,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  compareAtPrice?: number;

  @ApiPropertyOptional({
    example: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  costPrice?: number;

  @ApiPropertyOptional({
    example: 100,
    default: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  stock?: number;

  @ApiPropertyOptional({
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  trackInventory?: boolean;

  @ApiPropertyOptional({
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  allowBackorder?: boolean;

  @ApiPropertyOptional({
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  hasVariants?: boolean;

  @ApiPropertyOptional({
    enum: ProductStatus,
    example: ProductStatus.DRAFT,
  })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @ApiPropertyOptional({
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiProperty({
    example: 'category-uuid-here',
  })
  @IsUUID()
  categoryId: string;

  @ApiPropertyOptional({
    example: 'brand-uuid-here',
  })
  @IsOptional()
  @IsUUID()
  brandId?: string;

  @ApiPropertyOptional({
    example: 0.5,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  weight?: number;

  @ApiPropertyOptional({
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  length?: number;

  @ApiPropertyOptional({
    example: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  width?: number;

  @ApiPropertyOptional({
    example: 5,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  height?: number;

  @ApiPropertyOptional({
    example: ['hoodie', 'black', 'winter'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(20)
  keywords?: string[];

  @ApiPropertyOptional({
    example: 'Black Hoodie | Zemlo',
  })
  @IsOptional()
  @IsString()
  @Length(2, 200)
  metaTitle?: string;

  @ApiPropertyOptional({
    example: 'Shop premium black hoodie from Zemlo.',
  })
  @IsOptional()
  @IsString()
  @Length(2, 500)
  metaDescription?: string;

  @ApiPropertyOptional({
    type: [CreateAdminProductImageDto],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @Type(() => CreateAdminProductImageDto)
  images?: CreateAdminProductImageDto[];
}
