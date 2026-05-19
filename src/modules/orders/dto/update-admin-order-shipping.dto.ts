import { ApiPropertyOptional } from '@nestjs/swagger';
import { FulfillmentStatus } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  Length,
} from 'class-validator';

export class UpdateAdminOrderShippingDto {
  @ApiPropertyOptional({
    example: 'Standard Shipping',
  })
  @IsOptional()
  @IsString()
  @Length(2, 100)
  shippingMethod?: string;

  @ApiPropertyOptional({
    example: 'UPS',
  })
  @IsOptional()
  @IsString()
  @Length(2, 100)
  shippingCarrier?: string;

  @ApiPropertyOptional({
    example: '1Z999AA10123456784',
  })
  @IsOptional()
  @IsString()
  @Length(2, 150)
  trackingNumber?: string;

  @ApiPropertyOptional({
    example: 'https://www.ups.com/track?tracknum=1Z999AA10123456784',
  })
  @IsOptional()
  @IsUrl()
  trackingUrl?: string;

  @ApiPropertyOptional({
    example: '2026-05-25T12:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  estimatedDelivery?: string;

  @ApiPropertyOptional({
    example: '2026-05-24T15:30:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  actualDelivery?: string;

  @ApiPropertyOptional({
    enum: FulfillmentStatus,
    example: FulfillmentStatus.FULFILLED,
  })
  @IsOptional()
  @IsEnum(FulfillmentStatus)
  fulfillmentStatus?: FulfillmentStatus;

  @ApiPropertyOptional({
    example: 'Tracking number added by admin',
  })
  @IsOptional()
  @IsString()
  @Length(2, 500)
  note?: string;
}
