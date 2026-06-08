import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PublicBrandResponseDto {
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
}
