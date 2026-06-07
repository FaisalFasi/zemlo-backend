import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StripePaymentIntentResponseDto {
  @ApiProperty()
  orderId: string;

  @ApiProperty()
  orderNumber: string;

  @ApiProperty()
  paymentId: string;

  @ApiProperty({
    example: 'pi_3TaczuBlX6tkIsTB36Pkwqlc',
  })
  paymentIntentId: string;

  @ApiPropertyOptional({
    nullable: true,
    example: 'pi_3TaczuBlX6tkIsTB36Pkwqlc_secret_xxx',
  })
  clientSecret: string | null;

  @ApiProperty()
  amount: number;

  @ApiProperty({
    example: 'USD',
  })
  currency: string;

  @ApiProperty({
    example: 'requires_payment_method',
  })
  status: string;
}

export class StripeWebhookResponseDto {
  @ApiProperty()
  received: boolean;

  @ApiPropertyOptional()
  ignored?: boolean;

  @ApiPropertyOptional()
  eventType?: string;

  @ApiPropertyOptional()
  message?: string;

  @ApiPropertyOptional()
  paymentStatus?: string;

  @ApiPropertyOptional()
  orderStatus?: string;
}
