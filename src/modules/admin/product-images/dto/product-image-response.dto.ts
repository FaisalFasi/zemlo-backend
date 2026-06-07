import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProductImageResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  productId: string;

  @ApiProperty()
  url: string;

  @ApiPropertyOptional({ nullable: true })
  altText: string | null;

  @ApiProperty()
  position: number;

  @ApiProperty()
  isDefault: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
