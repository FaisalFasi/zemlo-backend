import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PublicCategorySummaryResponseDto {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String })
  name: string;

  @ApiProperty({ type: String })
  slug: string;
}

export class PublicBrandSummaryResponseDto {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String })
  name: string;

  @ApiProperty({ type: String })
  slug: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  logo: string | null;
}

export class PublicProductImageResponseDto {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String })
  url: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  altText: string | null;

  @ApiProperty({ type: Number })
  position: number;

  @ApiProperty({ type: Boolean })
  isDefault: boolean;
}

export class PublicProductVariantResponseDto {
  @ApiProperty({ type: String })
  id: string;

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

  @ApiProperty({
    type: Object,
    description: 'Variant option values, for example color/size metadata.',
  })
  options: unknown;
}
