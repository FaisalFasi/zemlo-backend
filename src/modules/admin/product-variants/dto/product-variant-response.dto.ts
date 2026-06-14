import { ApiProperty } from '@nestjs/swagger';

export class ProductVariantResponseDto {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String })
  productId: string;

  @ApiProperty({ type: String })
  name: string;

  @ApiProperty({ type: String, nullable: true })
  sku: string | null;

  @ApiProperty({ type: Number, nullable: true })
  price: number | null;

  @ApiProperty({ type: Number, nullable: true })
  compareAtPrice: number | null;

  @ApiProperty({ type: Number, nullable: true })
  costPrice: number | null;

  @ApiProperty({ type: Number })
  stock: number;

  @ApiProperty({ type: Boolean })
  trackInventory: boolean;

  @ApiProperty({ type: Boolean })
  allowBackorder: boolean;

  @ApiProperty({ type: Boolean })
  isActive: boolean;

  @ApiProperty({ type: String, nullable: true })
  image: string | null;

  @ApiProperty({
    type: Object,
    description: 'Variant option values, for example color/size metadata.',
  })
  options: unknown;

  @ApiProperty({ type: Date })
  createdAt: Date;

  @ApiProperty({ type: Date })
  updatedAt: Date;
}
