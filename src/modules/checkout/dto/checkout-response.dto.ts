import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  FulfillmentStatus,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from '@prisma/client';

export class CheckoutOrderItemResponseDto {
  @ApiProperty()
  productId: string;

  @ApiPropertyOptional({ nullable: true })
  variantId: string | null;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional({ nullable: true })
  variantName: string | null;

  @ApiPropertyOptional({ nullable: true })
  sku: string | null;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  unitPrice: number;

  @ApiProperty()
  totalPrice: number;
}

export class CheckoutOrderResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  orderNumber: string;

  @ApiProperty({ enum: OrderStatus })
  status: OrderStatus;

  @ApiProperty({ enum: PaymentStatus })
  paymentStatus: PaymentStatus;

  @ApiProperty({ enum: FulfillmentStatus })
  fulfillmentStatus: FulfillmentStatus;

  @ApiProperty()
  subtotal: number;

  @ApiProperty()
  tax: number;

  @ApiProperty()
  shippingCost: number;

  @ApiProperty()
  discount: number;

  @ApiProperty()
  total: number;

  @ApiProperty({ type: [CheckoutOrderItemResponseDto] })
  items: CheckoutOrderItemResponseDto[];
}

export class CheckoutPaymentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: PaymentMethod })
  method: PaymentMethod;

  @ApiProperty({ enum: PaymentStatus })
  status: PaymentStatus;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  currency: string;
}

export class CheckoutResponseDto {
  @ApiProperty({
    example: 'Checkout created successfully',
  })
  message: string;

  @ApiProperty({ type: CheckoutOrderResponseDto })
  order: CheckoutOrderResponseDto;

  @ApiProperty({ type: CheckoutPaymentResponseDto })
  payment: CheckoutPaymentResponseDto;

  @ApiProperty({
    example: 'Order is pending confirmation for cash on delivery',
  })
  nextStep: string;
}
