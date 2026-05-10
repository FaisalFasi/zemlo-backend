// src/modules/checkout/dto/guest-checkout.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Length,
  ValidateNested,
} from 'class-validator';
import { CheckoutItemDto } from './checkout-item.dto';
import { CheckoutAddressDto } from './checkout-address.dto';

export class GuestCheckoutDto {
  @ApiProperty({
    example: 'guest@test.com',
  })
  @IsEmail()
  guestEmail: string;

  @ApiProperty({
    example: '+13001234567',
  })
  @IsString()
  @Length(5, 30)
  guestPhone: string;

  @ApiProperty({
    example: 'Ali',
  })
  @IsString()
  @Length(1, 100)
  guestFirstName: string;

  @ApiProperty({
    example: 'Khan',
  })
  @IsString()
  @Length(1, 100)
  guestLastName: string;

  @ApiProperty({
    type: [CheckoutItemDto],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CheckoutItemDto)
  items: CheckoutItemDto[];

  @ApiProperty({
    type: CheckoutAddressDto,
  })
  @ValidateNested()
  @Type(() => CheckoutAddressDto)
  shippingAddress: CheckoutAddressDto;

  @ApiPropertyOptional({
    type: CheckoutAddressDto,
    description:
      'If not provided, backend can use shipping address as billing address',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CheckoutAddressDto)
  billingAddress?: CheckoutAddressDto;

  @ApiProperty({
    enum: PaymentMethod,
    example: PaymentMethod.CASH_ON_DELIVERY,
  })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiPropertyOptional({
    example: 'Please call before delivery',
  })
  @IsOptional()
  @IsString()
  @Length(1, 1000)
  customerNote?: string;
}
