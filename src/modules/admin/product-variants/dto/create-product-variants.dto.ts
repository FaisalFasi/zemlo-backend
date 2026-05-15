import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Length,
  Min,
} from 'class-validator';

export class CreateProductVariantDto {
  @ApiProperty({
    example: 'Black / Medium',
  })
  @IsString()
  @Length(2, 150)
  name: string;

  @ApiProperty({
    example: 'HOODIE-BLACK-M',
  })
  @IsString()
  @Length(2, 100)
  sku: string;

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
    example: 50,
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
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    example: 'https://placehold.co/600x600?text=Black+Medium',
  })
  @IsOptional()
  @IsString()
  @Length(5, 1000)
  image?: string;

  @ApiPropertyOptional({
    example: {
      color: 'Black',
      size: 'M',
    },
    description: 'Variant options like color, size, material.',
  })
  @IsOptional()
  @IsObject()
  options?: Record<string, string>;
}
