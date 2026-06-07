import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProductVariantResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  productId: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional({ nullable: true })
  sku: string | null;

  @ApiPropertyOptional({ nullable: true })
  price: number | null;

  @ApiPropertyOptional({ nullable: true })
  compareAtPrice: number | null;

  @ApiPropertyOptional({ nullable: true })
  costPrice: number | null;

  @ApiProperty()
  stock: number;

  @ApiProperty()
  trackInventory: boolean;

  @ApiProperty()
  allowBackorder: boolean;

  @ApiProperty()
  isActive: boolean;

  @ApiPropertyOptional({ nullable: true })
  image: string | null;

  @ApiProperty({
    type: Object,
    description: 'Variant option values, for example color/size metadata.',
  })
  options: unknown;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
