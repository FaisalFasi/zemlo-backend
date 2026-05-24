import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class AddCartItemDto {
  @ApiProperty({
    example: '6df42a4d-8fa3-4f91-b66e-b77f2b01b6de',
    description: 'Product ID',
  })
  @IsUUID()
  productId: string;

  @ApiPropertyOptional({
    example: 'd3d652c0-68f2-4984-a6b7-421a75b73d1d',
    description: 'Variant ID. Required when the product has variants.',
  })
  @IsOptional()
  @IsUUID()
  variantId?: string;

  @ApiProperty({
    example: 1,
    minimum: 1,
    maximum: 999,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(999)
  quantity: number;
}
