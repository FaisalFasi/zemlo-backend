import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductStatus } from '@prisma/client';

export class AdminBrandProductSummaryResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiProperty({ enum: ProductStatus })
  status: ProductStatus;
}

export class AdminBrandCountResponseDto {
  @ApiProperty()
  products: number;
}

export class AdminBrandResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiPropertyOptional({ nullable: true })
  description: string | null;

  @ApiPropertyOptional({ nullable: true })
  logo: string | null;

  @ApiPropertyOptional({ nullable: true })
  website: string | null;

  @ApiProperty()
  isActive: boolean;

  @ApiPropertyOptional({ type: [AdminBrandProductSummaryResponseDto] })
  products?: AdminBrandProductSummaryResponseDto[];

  @ApiPropertyOptional({ type: AdminBrandCountResponseDto })
  _count?: AdminBrandCountResponseDto;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
