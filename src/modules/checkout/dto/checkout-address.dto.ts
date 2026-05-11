// src/modules/checkout/dto/checkout-address.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length } from 'class-validator';

export class CheckoutAddressDto {
  @ApiProperty({
    example: 'Ali',
  })
  @IsString()
  @Length(1, 100)
  firstName: string;

  @ApiProperty({
    example: 'Khan',
  })
  @IsString()
  @Length(1, 100)
  lastName: string;

  @ApiPropertyOptional({
    example: 'Zemlo LLC',
  })
  @IsOptional()
  @IsString()
  @Length(1, 150)
  company?: string;

  @ApiProperty({
    example: '+13001234567',
  })
  @IsString()
  @Length(5, 30)
  phone: string;

  @ApiProperty({
    example: '123 Main Street',
  })
  @IsString()
  @Length(1, 255)
  street: string;

  @ApiPropertyOptional({
    example: 'Apartment 4B',
  })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  apartment?: string;

  @ApiProperty({
    example: 'New York',
  })
  @IsString()
  @Length(1, 100)
  city: string;

  @ApiProperty({
    example: 'NY',
  })
  @IsString()
  @Length(1, 100)
  state: string;

  @ApiProperty({
    example: '10001',
  })
  @IsString()
  @Length(3, 20)
  zipCode: string;

  @ApiPropertyOptional({
    example: 'US',
    default: 'US',
  })
  @IsOptional()
  @IsString()
  @Length(2, 100)
  country?: string;
}
