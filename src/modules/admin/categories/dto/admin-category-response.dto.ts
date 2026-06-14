import { ApiProperty } from '@nestjs/swagger';
import { ProductStatus } from '@prisma/client';

export class AdminCategoryParentResponseDto {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String })
  name: string;

  @ApiProperty({ type: String })
  slug: string;
}

export class AdminCategoryChildResponseDto {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String })
  name: string;

  @ApiProperty({ type: String })
  slug: string;

  @ApiProperty({ type: Boolean })
  isActive: boolean;

  @ApiProperty({ type: Number })
  position: number;
}

export class AdminCategoryProductSummaryResponseDto {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String })
  name: string;

  @ApiProperty({ type: String })
  slug: string;

  @ApiProperty({ enum: ProductStatus })
  status: ProductStatus;
}

export class AdminCategoryCountResponseDto {
  @ApiProperty({ type: Number })
  products: number;
}

export class AdminCategoryResponseDto {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String })
  name: string;

  @ApiProperty({ type: String })
  slug: string;

  @ApiProperty({ type: String, nullable: true })
  description: string | null;

  @ApiProperty({ type: String, nullable: true })
  image: string | null;

  @ApiProperty({ type: Boolean })
  isActive: boolean;

  @ApiProperty({ type: Number })
  position: number;

  @ApiProperty({ type: String, nullable: true })
  parentId: string | null;

  @ApiProperty({ type: AdminCategoryParentResponseDto, nullable: true })
  parent?: AdminCategoryParentResponseDto | null;

  @ApiProperty({ type: [AdminCategoryChildResponseDto] })
  children?: AdminCategoryChildResponseDto[];

  @ApiProperty({ type: [AdminCategoryProductSummaryResponseDto] })
  products?: AdminCategoryProductSummaryResponseDto[];

  @ApiProperty({ type: AdminCategoryCountResponseDto })
  _count?: AdminCategoryCountResponseDto;

  @ApiProperty({ type: Date })
  createdAt: Date;

  @ApiProperty({ type: Date })
  updatedAt: Date;
}
