import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Length,
  ValidateNested,
} from 'class-validator';

import { CheckoutAddressDto } from './checkout-address.dto';

export class FromCartCheckoutDto {
  @ApiPropertyOptional({
    type: String,
    example: 'guest@test.com',
    description: 'Required only for guest checkout.',
  })
  @IsOptional()
  @IsEmail()
  guestEmail?: string;

  @ApiPropertyOptional({
    type: String,
    example: '+13001234567',
    description: 'Required only for guest checkout.',
  })
  @IsOptional()
  @IsString()
  @Length(5, 30)
  guestPhone?: string;

  @ApiPropertyOptional({
    type: String,
    example: 'Ali',
    description: 'Required only for guest checkout.',
  })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  guestFirstName?: string;

  @ApiPropertyOptional({
    type: String,
    example: 'Khan',
    description: 'Required only for guest checkout.',
  })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  guestLastName?: string;

  @ApiProperty({
    type: CheckoutAddressDto,
  })
  @ValidateNested()
  @Type(() => CheckoutAddressDto)
  shippingAddress: CheckoutAddressDto;

  @ApiPropertyOptional({
    type: CheckoutAddressDto,
    description:
      'If not provided, backend can use shipping address as billing address.',
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

  @ApiPropertyOptional({ type: String, example: 'Please call before delivery' })
  @IsOptional()
  @IsString()
  @Length(1, 1000)
  customerNote?: string;
}
