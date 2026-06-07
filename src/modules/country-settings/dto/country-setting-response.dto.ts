import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CountrySettingResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  iso2: string;

  @ApiPropertyOptional({ nullable: true })
  iso3: string | null;

  @ApiPropertyOptional({ nullable: true })
  currency: string | null;

  @ApiPropertyOptional({ nullable: true })
  phoneCode: string | null;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  allowWebsiteAccess: boolean;

  @ApiProperty()
  allowCheckout: boolean;

  @ApiProperty()
  allowShipping: boolean;

  @ApiProperty()
  isDefault: boolean;

  @ApiProperty()
  sortOrder: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
