import { ApiProperty } from '@nestjs/swagger';

export class ProductImageResponseDto {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String })
  productId: string;

  @ApiProperty({ type: String })
  url: string;

  @ApiProperty({ type: String, nullable: true })
  altText: string | null;

  @ApiProperty({ type: Number })
  position: number;

  @ApiProperty({ type: Boolean })
  isDefault: boolean;

  @ApiProperty({ type: Date })
  createdAt: Date;

  @ApiProperty({ type: Date })
  updatedAt: Date;
}
