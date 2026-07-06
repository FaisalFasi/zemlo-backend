import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsUUID } from 'class-validator';

export class CreateStripePaymentIntentDto {
  @ApiProperty({
    example: 'b5a2e7e3-2bc0-4969-9b1f-6d0c4d5f2f11',
    description: 'Order ID returned from checkout',
  })
  @IsUUID()
  orderId: string;

  @ApiPropertyOptional({
    example: 'customer@example.com',
    description:
      'Required for guest orders. Must match the email used during checkout.',
  })
  @IsOptional()
  @IsEmail()
  guestEmail?: string;
}
