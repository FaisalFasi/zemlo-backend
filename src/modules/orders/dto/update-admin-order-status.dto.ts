import { ApiPropertyOptional } from '@nestjs/swagger';
import { FulfillmentStatus, OrderStatus, PaymentStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, Length } from 'class-validator';

export class UpdateAdminOrderStatusDto {
  @ApiPropertyOptional({
    enum: OrderStatus,
    example: OrderStatus.CONFIRMED,
  })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiPropertyOptional({
    enum: PaymentStatus,
    example: PaymentStatus.PAID,
  })
  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @ApiPropertyOptional({
    enum: FulfillmentStatus,
    example: FulfillmentStatus.UNFULFILLED,
  })
  @IsOptional()
  @IsEnum(FulfillmentStatus)
  fulfillmentStatus?: FulfillmentStatus;

  @ApiPropertyOptional({
    example: 'Payment confirmed by admin',
  })
  @IsOptional()
  @IsString()
  @Length(2, 500)
  note?: string;
}
