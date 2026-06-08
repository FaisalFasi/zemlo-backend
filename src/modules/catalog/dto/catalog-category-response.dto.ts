import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PublicCategoryChildResponseDto {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String })
  name: string;

  @ApiProperty({ type: String })
  slug: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  description: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  image: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  parentId: string | null;
}

export class PublicCategoryResponseDto {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String })
  name: string;

  @ApiProperty({ type: String })
  slug: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  description: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  image: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  parentId: string | null;

  @ApiProperty({ type: [PublicCategoryChildResponseDto] })
  children: PublicCategoryChildResponseDto[];
}
