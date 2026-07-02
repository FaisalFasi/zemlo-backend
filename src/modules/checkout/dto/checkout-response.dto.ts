import { ApiProperty } from '@nestjs/swagger';
import {
  FulfillmentStatus,
  OrderInventoryStatus,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from '@prisma/client';

export class CheckoutOrderItemResponseDto {
  @ApiProperty({ type: String })
  productId: string;

  @ApiProperty({ type: String, nullable: true })
  variantId: string | null;

  @ApiProperty({ type: String })
  productName: string;

  @ApiProperty({ type: String, nullable: true })
  variantName: string | null;

  @ApiProperty({ type: String, nullable: true })
  sku: string | null;

  @ApiProperty({ type: Number })
  quantity: number;

  @ApiProperty({ type: Number })
  unitPrice: number;

  @ApiProperty({ type: Number })
  totalPrice: number;
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

  @ApiProperty({ enum: OrderInventoryStatus, enumName: 'OrderInventoryStatus' })
  inventoryStatus: OrderInventoryStatus;

  @ApiProperty({ type: Date, nullable: true })
  inventoryReservedAt: Date | null;

  @ApiProperty({ type: Date, nullable: true })
  inventoryCommittedAt: Date | null;

  @ApiProperty({ type: Date, nullable: true })
  inventoryReleasedAt: Date | null;

  @ApiProperty({ type: Date, nullable: true })
  inventoryExpiresAt: Date | null;
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

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'Stripe PaymentIntent id or provider payment intent id.',
  })
  paymentIntentId: string | null;

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'Stripe client secret used by the frontend PaymentElement.',
  })
  clientSecret: string | null;
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
