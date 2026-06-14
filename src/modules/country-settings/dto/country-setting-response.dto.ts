import { ApiProperty } from '@nestjs/swagger';

export class CountrySettingResponseDto {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String })
  name: string;

  @ApiProperty({ type: String })
  iso2: string;

  @ApiProperty({ type: String, nullable: true })
  iso3: string | null;

  @ApiProperty({ type: String, nullable: true })
  currency: string | null;

  @ApiProperty({ type: String, nullable: true })
  phoneCode: string | null;

  @ApiProperty({ type: Boolean })
  isActive: boolean;

  @ApiProperty({ type: Boolean })
  allowWebsiteAccess: boolean;

  @ApiProperty({ type: Boolean })
  allowCheckout: boolean;

  @ApiProperty({ type: Boolean })
  allowShipping: boolean;

  @ApiProperty({ type: Boolean })
  isDefault: boolean;

  @ApiProperty({ type: Number })
  sortOrder: number;

  @ApiProperty({ type: Date })
  createdAt: Date;

  @ApiProperty({ type: Date })
  updatedAt: Date;
}
