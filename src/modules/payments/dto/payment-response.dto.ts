import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StripePaymentIntentResponseDto {
  @ApiProperty({ type: String })
  orderId: string;

  @ApiProperty({ type: String })
  orderNumber: string;

  @ApiProperty({ type: String })
  paymentId: string;

  @ApiProperty({ type: String, example: 'pi_3TaczuBlX6tkIsTB36Pkwqlc' })
  paymentIntentId: string;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    example: 'pi_3TaczuBlX6tkIsTB36Pkwqlc_secret_xxx',
  })
  clientSecret: string | null;

  @ApiProperty({ type: Number })
  amount: number;

  @ApiProperty({ type: String, example: 'USD' })
  currency: string;

  @ApiProperty({ type: String, example: 'requires_payment_method' })
  status: string;
}

export class StripeWebhookResponseDto {
  @ApiProperty({ type: Boolean })
  received: boolean;

  @ApiPropertyOptional({ type: Boolean })
  ignored?: boolean;

  @ApiPropertyOptional({ type: String })
  eventType?: string;

  @ApiPropertyOptional({ type: String })
  message?: string;

  @ApiPropertyOptional({ type: String })
  paymentStatus?: string;

  @ApiPropertyOptional({ type: String })
  orderStatus?: string;
}
