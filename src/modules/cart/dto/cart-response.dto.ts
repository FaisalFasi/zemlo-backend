import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class CartCategoryResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;
}

class CartBrandResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiPropertyOptional({ nullable: true })
  logo: string | null;
}

class CartImageResponseDto {
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

class CartProductResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiPropertyOptional({ nullable: true })
  shortDescription: string | null;

  @ApiPropertyOptional({ nullable: true })
  sku: string | null;

  @ApiProperty()
  price: number;

  @ApiPropertyOptional({ nullable: true })
  compareAtPrice: number | null;

  @ApiProperty()
  stock: number;

  @ApiProperty()
  trackInventory: boolean;

  @ApiProperty()
  allowBackorder: boolean;

  @ApiProperty()
  hasVariants: boolean;

  @ApiProperty({ type: CartCategoryResponseDto })
  category: CartCategoryResponseDto;

  @ApiPropertyOptional({ type: CartBrandResponseDto, nullable: true })
  brand: CartBrandResponseDto | null;

  @ApiProperty({ type: [CartImageResponseDto] })
  images: CartImageResponseDto[];
}

class CartVariantResponseDto {
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

  @ApiProperty()
  options: unknown;
}

class CartItemResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  cartId: string;

  @ApiProperty()
  productId: string;

  @ApiPropertyOptional({ nullable: true })
  variantId: string | null;

  @ApiProperty()
  variantKey: string;

  @ApiProperty()
  addedAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  unitPrice: number;

  @ApiProperty()
  lineTotal: number;

  @ApiProperty({ type: CartProductResponseDto })
  product: CartProductResponseDto;

  @ApiPropertyOptional({ type: CartVariantResponseDto, nullable: true })
  variant: CartVariantResponseDto | null;
}

export class CartResponseDto {
  @ApiProperty()
  id: string;

  @ApiPropertyOptional({ nullable: true })
  userId: string | null;

  @ApiPropertyOptional({ nullable: true })
  guestId: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ type: [CartItemResponseDto] })
  items: CartItemResponseDto[];

  @ApiProperty()
  totalItems: number;

  @ApiProperty()
  totalQuantity: number;

  @ApiProperty()
  subtotal: number;
}
