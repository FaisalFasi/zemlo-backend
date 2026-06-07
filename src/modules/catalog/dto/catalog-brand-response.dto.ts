import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PublicBrandResponseDto {
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
}
