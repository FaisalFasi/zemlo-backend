import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductStatus } from '@prisma/client';

export class AdminBrandProductSummaryResponseDto {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String })
  name: string;

  @ApiProperty({ type: String })
  slug: string;

  @ApiProperty({ enum: ProductStatus })
  status: ProductStatus;
}

export class AdminBrandCountResponseDto {
  @ApiProperty({ type: Number })
  products: number;
}

export class AdminBrandResponseDto {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String })
  name: string;

  @ApiProperty({ type: String })
  slug: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  description: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  logo: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  website: string | null;

  @ApiProperty({ type: Boolean })
  isActive: boolean;

  @ApiPropertyOptional({ type: [AdminBrandProductSummaryResponseDto] })
  products?: AdminBrandProductSummaryResponseDto[];

  @ApiPropertyOptional({ type: AdminBrandCountResponseDto })
  _count?: AdminBrandCountResponseDto;

  @ApiProperty({ type: Date })
  createdAt: Date;

  @ApiProperty({ type: Date })
  updatedAt: Date;
}
