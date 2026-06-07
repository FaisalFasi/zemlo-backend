import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PublicCategoryChildResponseDto {
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

  @ApiPropertyOptional({ nullable: true })
  parentId: string | null;
}

export class PublicCategoryResponseDto {
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

  @ApiPropertyOptional({ nullable: true })
  parentId: string | null;

  @ApiProperty({ type: [PublicCategoryChildResponseDto] })
  children: PublicCategoryChildResponseDto[];
}
