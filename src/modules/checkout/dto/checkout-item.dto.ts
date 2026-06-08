// src/modules/checkout/dto/checkout-item.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CheckoutItemDto {
  @ApiProperty({
    type: String,
    example: 'product-uuid-here',
    description: 'Product ID',
  })
  @IsString()
  @IsUUID()
  productId: string;

  @ApiPropertyOptional({
    type: String,
    example: 'variant-uuid-here',
    description: 'Optional variant ID if product has variants',
  })
  @IsOptional()
  @IsString()
  @IsUUID()
  variantId?: string;

  @ApiProperty({
    type: Number,
    example: 2,
    description: 'Quantity user wants to buy',
  })
  @IsInt()
  @Min(1)
  quantity: number;
}
