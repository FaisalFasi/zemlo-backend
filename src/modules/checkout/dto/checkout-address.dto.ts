// src/modules/checkout/dto/checkout-address.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length } from 'class-validator';

export class CheckoutAddressDto {
  @ApiProperty({ type: String, example: 'Ali' })
  @IsString()
  @Length(1, 100)
  firstName: string;

  @ApiProperty({ type: String, example: 'Khan' })
  @IsString()
  @Length(1, 100)
  lastName: string;

  @ApiPropertyOptional({ type: String, example: 'Zemlo LLC' })
  @IsOptional()
  @IsString()
  @Length(1, 150)
  company?: string;

  @ApiProperty({ type: String, example: '+13001234567' })
  @IsString()
  @Length(5, 30)
  phone: string;

  @ApiProperty({ type: String, example: '123 Main Street' })
  @IsString()
  @Length(1, 255)
  street: string;

  @ApiPropertyOptional({ type: String, example: 'Apartment 4B' })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  apartment?: string;

  @ApiProperty({ type: String, example: 'New York' })
  @IsString()
  @Length(1, 100)
  city: string;

  @ApiProperty({ type: String, example: 'NY' })
  @IsString()
  @Length(1, 100)
  state: string;

  @ApiProperty({ type: String, example: '10001' })
  @IsString()
  @Length(3, 20)
  zipCode: string;

  @ApiPropertyOptional({
    type: String,
    example: 'US',
    description: 'ISO2 country code, for example US, DE, PK',
    default: 'US',
  })
  @IsOptional()
  @IsString()
  @Length(2, 2)
  country: string;
}
