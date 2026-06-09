import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  FulfillmentStatus,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from '@prisma/client';

export class CheckoutOrderItemResponseDto {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String })
  productId: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  variantId: string | null;

  @ApiProperty({ type: String })
  productName: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  variantName: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  sku: string | null;

  @ApiProperty({ type: Number })
  quantity: number;

  @ApiProperty({ type: Number })
  unitPrice: number;

  @ApiProperty({ type: Number })
  totalPrice: number;

  @ApiPropertyOptional({ type: Object, nullable: true })
  productSnapshot: Record<string, unknown> | null;
}

export class CheckoutOrderResponseDto {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String })
  orderNumber: string;

  @ApiProperty({ enum: OrderStatus, enumName: 'OrderStatus' })
  status: OrderStatus;

  @ApiProperty({ enum: PaymentStatus, enumName: 'PaymentStatus' })
  paymentStatus: PaymentStatus;

  @ApiProperty({ enum: FulfillmentStatus, enumName: 'FulfillmentStatus' })
  fulfillmentStatus: FulfillmentStatus;

  @ApiProperty({ type: Number })
  subtotal: number;

  @ApiProperty({ type: Number })
  tax: number;

  @ApiProperty({ type: Number })
  shippingCost: number;

  @ApiProperty({ type: Number })
  discount: number;

  @ApiProperty({ type: Number })
  total: number;

  @ApiProperty({ type: () => [CheckoutOrderItemResponseDto] })
  items: CheckoutOrderItemResponseDto[];
}

export class CheckoutPaymentResponseDto {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ enum: PaymentMethod, enumName: 'PaymentMethod' })
  method: PaymentMethod;

  @ApiProperty({ enum: PaymentStatus, enumName: 'PaymentStatus' })
  status: PaymentStatus;

  @ApiProperty({ type: Number })
  amount: number;

  @ApiProperty({ type: String })
  currency: string;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    description: 'Stripe PaymentIntent id or provider payment intent id.',
  })
  paymentIntentId?: string | null;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    description: 'Stripe client secret used by the frontend PaymentElement.',
  })
  clientSecret?: string | null;
}

export class CheckoutResponseDto {
  @ApiProperty({
    type: String,
    example: 'Checkout created successfully',
  })
  message: string;

  @ApiProperty({ type: () => CheckoutOrderResponseDto })
  order: CheckoutOrderResponseDto;

  @ApiProperty({ type: () => CheckoutPaymentResponseDto })
  payment: CheckoutPaymentResponseDto;

  @ApiProperty({
    type: String,
    example: 'Complete payment using the selected payment method',
  })
  nextStep: string;
}
