import { ApiProperty } from '@nestjs/swagger';

export class PublicBrandResponseDto {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String })
  name: string;

  @ApiProperty({ type: String })
  slug: string;

  @ApiProperty({ type: String, nullable: true })
  description: string | null;

  @ApiProperty({ type: String, nullable: true })
  logo: string | null;

  @ApiProperty({ type: String, nullable: true })
  website: string | null;
}
