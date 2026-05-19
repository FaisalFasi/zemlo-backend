import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, Length } from 'class-validator';

export class CreateAdminBrandDto {
  @ApiProperty({
    example: 'Nike',
  })
  @IsString()
  @Length(2, 100)
  name: string;

  @ApiPropertyOptional({
    example: 'nike',
    description: 'Optional. If not provided, backend generates from name.',
  })
  @IsOptional()
  @IsString()
  @Length(2, 120)
  slug?: string;

  @ApiPropertyOptional({
    example: 'Premium sportswear and lifestyle brand.',
  })
  @IsOptional()
  @IsString()
  @Length(2, 1000)
  description?: string;

  @ApiPropertyOptional({
    example: 'https://placehold.co/300x100?text=Nike',
  })
  @IsOptional()
  @IsString()
  @Length(5, 1000)
  logo?: string;

  @ApiPropertyOptional({
    example: 'https://www.nike.com',
  })
  @IsOptional()
  @IsString()
  @Length(5, 1000)
  website?: string;

  @ApiPropertyOptional({
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
