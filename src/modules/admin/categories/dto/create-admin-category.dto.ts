import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAdminCategoryDto {
  @ApiProperty({
    example: 'Hoodies',
  })
  @IsString()
  @Length(2, 100)
  name: string;

  @ApiPropertyOptional({
    example: 'hoodies',
    description: 'Optional. If not provided, backend generates from name.',
  })
  @IsOptional()
  @IsString()
  @Length(2, 120)
  slug?: string;

  @ApiPropertyOptional({
    example: 'Premium hoodies and sweatshirts.',
  })
  @IsOptional()
  @IsString()
  @Length(2, 1000)
  description?: string;

  @ApiPropertyOptional({
    example: 'https://placehold.co/600x600?text=Hoodies',
  })
  @IsOptional()
  @IsString()
  @Length(5, 1000)
  image?: string;

  @ApiPropertyOptional({
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

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
    example: 'parent-category-uuid',
    description: 'Optional parent category ID for nested categories.',
  })
  @IsOptional()
  @IsUUID()
  parentId?: string;
}
