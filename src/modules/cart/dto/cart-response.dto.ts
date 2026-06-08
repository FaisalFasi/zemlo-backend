import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class CartCategoryResponseDto {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String })
  name: string;

  @ApiProperty({ type: String })
  slug: string;
}

class CartBrandResponseDto {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String })
  name: string;

  @ApiProperty({ type: String })
  slug: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  logo: string | null;
}

class CartImageResponseDto {
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

class CartProductResponseDto {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String })
  name: string;

  @ApiProperty({ type: String })
  slug: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  shortDescription: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  sku: string | null;

  @ApiProperty({ type: Number })
  price: number;

  @ApiPropertyOptional({ type: Number, nullable: true })
  compareAtPrice: number | null;

  @ApiProperty({ type: Number })
  stock: number;

  @ApiProperty({ type: Boolean })
  trackInventory: boolean;

  @ApiProperty({ type: Boolean })
  allowBackorder: boolean;

  @ApiProperty({ type: Boolean })
  hasVariants: boolean;

  @ApiProperty({ type: CartCategoryResponseDto })
  category: CartCategoryResponseDto;

  @ApiPropertyOptional({ type: CartBrandResponseDto, nullable: true })
  brand: CartBrandResponseDto | null;

  @ApiProperty({ type: [CartImageResponseDto] })
  images: CartImageResponseDto[];
}

class CartVariantResponseDto {
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

  @ApiProperty({ type: Object })
  options: unknown;
}

class CartItemResponseDto {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: Number })
  quantity: number;

  @ApiProperty({ type: String })
  cartId: string;

  @ApiProperty({ type: String })
  productId: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  variantId: string | null;

  @ApiProperty({ type: String })
  variantKey: string;

  @ApiProperty({ type: Date })
  addedAt: Date;

  @ApiProperty({ type: Date })
  updatedAt: Date;

  @ApiProperty({ type: Number })
  unitPrice: number;

  @ApiProperty({ type: Number })
  lineTotal: number;

  @ApiProperty({ type: CartProductResponseDto })
  product: CartProductResponseDto;

  @ApiPropertyOptional({ type: CartVariantResponseDto, nullable: true })
  variant: CartVariantResponseDto | null;
}

export class CartResponseDto {
  @ApiProperty({ type: String })
  id: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  userId: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  guestId: string | null;

  @ApiProperty({ type: Date })
  createdAt: Date;

  @ApiProperty({ type: Date })
  updatedAt: Date;

  @ApiProperty({ type: [CartItemResponseDto] })
  items: CartItemResponseDto[];

  @ApiProperty({ type: Number })
  totalItems: number;

  @ApiProperty({ type: Number })
  totalQuantity: number;

  @ApiProperty({ type: Number })
  subtotal: number;
}
