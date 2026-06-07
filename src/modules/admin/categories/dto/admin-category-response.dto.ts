import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductStatus } from '@prisma/client';

export class AdminCategoryParentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;
}

export class AdminCategoryChildResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  position: number;
}

export class AdminCategoryProductSummaryResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiProperty({ enum: ProductStatus })
  status: ProductStatus;
}

export class AdminCategoryCountResponseDto {
  @ApiProperty()
  products: number;
}

export class AdminCategoryResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiPropertyOptional({ nullable: true })
  description: string | null;

  @ApiPropertyOptional({ nullable: true })
  image: string | null;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  position: number;

  @ApiPropertyOptional({ nullable: true })
  parentId: string | null;

  @ApiPropertyOptional({ type: AdminCategoryParentResponseDto, nullable: true })
  parent?: AdminCategoryParentResponseDto | null;

  @ApiProperty({ type: [AdminCategoryChildResponseDto] })
  children?: AdminCategoryChildResponseDto[];

  @ApiPropertyOptional({ type: [AdminCategoryProductSummaryResponseDto] })
  products?: AdminCategoryProductSummaryResponseDto[];

  @ApiPropertyOptional({ type: AdminCategoryCountResponseDto })
  _count?: AdminCategoryCountResponseDto;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
