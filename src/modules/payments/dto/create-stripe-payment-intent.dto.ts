import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CreateStripePaymentIntentDto {
  @ApiProperty({
    example: 'b5a2e7e3-2bc0-4969-9b1f-6d0c4d5f2f11',
    description: 'Order ID created from checkout/from-cart',
  })
  @IsUUID()
  orderId: string;
}
