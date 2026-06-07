import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PublicCategorySummaryResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;
}

export class PublicBrandSummaryResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiPropertyOptional({ nullable: true })
  logo: string | null;
}

export class PublicProductImageResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  url: string;

  @ApiPropertyOptional({ nullable: true })
  altText: string | null;

  @ApiProperty()
  position: number;

  @ApiProperty()
  isDefault: boolean;
}

export class PublicProductVariantResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional({ nullable: true })
  sku: string | null;

  @ApiPropertyOptional({ nullable: true })
  price: number | null;

  @ApiPropertyOptional({ nullable: true })
  compareAtPrice: number | null;

  @ApiProperty()
  stock: number;

  @ApiProperty()
  trackInventory: boolean;

  @ApiProperty()
  allowBackorder: boolean;

  @ApiPropertyOptional({ nullable: true })
  image: string | null;

  @ApiProperty({
    type: Object,
    description: 'Variant option values, for example color/size metadata.',
  })
  options: unknown;
}
