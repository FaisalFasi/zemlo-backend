import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  AddressType,
  FulfillmentStatus,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  UserRole,
} from '@prisma/client';

export class OrderCustomerResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiPropertyOptional({ nullable: true })
  phone?: string | null;

  @ApiProperty({ enum: UserRole })
  role: UserRole;
}

export class OrderProductSummaryResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiPropertyOptional({ nullable: true })
  sku?: string | null;
}

export class OrderVariantSummaryResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional({ nullable: true })
  sku: string | null;
}

export class OrderItemResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  orderId: string;

  @ApiProperty()
  productId: string;

  @ApiPropertyOptional({ nullable: true })
  variantId: string | null;

  @ApiProperty()
  productName: string;

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

  @ApiPropertyOptional({ type: Object, nullable: true })
  productSnapshot: unknown | null;

  @ApiPropertyOptional({ type: OrderProductSummaryResponseDto, nullable: true })
  product?: OrderProductSummaryResponseDto | null;

  @ApiPropertyOptional({ type: OrderVariantSummaryResponseDto, nullable: true })
  variant?: OrderVariantSummaryResponseDto | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class OrderPaymentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  orderId: string;

  @ApiProperty({ enum: PaymentMethod })
  method: PaymentMethod;

  @ApiProperty({ enum: PaymentStatus })
  status: PaymentStatus;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  currency: string;

  @ApiPropertyOptional({ nullable: true })
  transactionId: string | null;

  @ApiPropertyOptional({ nullable: true })
  paymentIntentId: string | null;

  @ApiPropertyOptional({ nullable: true })
  paidAt: Date | null;

  @ApiPropertyOptional({ nullable: true })
  failedAt: Date | null;

  @ApiPropertyOptional({ nullable: true })
  refundedAt: Date | null;

  @ApiPropertyOptional({ nullable: true })
  failureReason: string | null;

  @ApiPropertyOptional({ type: Object, nullable: true })
  gatewayResponse: unknown | null;

  @ApiPropertyOptional({ type: Object, nullable: true })
  metadata: unknown | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class OrderAddressResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  orderId: string;

  @ApiProperty({ enum: AddressType })
  type: AddressType;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  phone: string;

  @ApiProperty()
  street: string;

  @ApiPropertyOptional({ nullable: true })
  apartment: string | null;

  @ApiProperty()
  city: string;

  @ApiProperty()
  state: string;

  @ApiProperty()
  zipCode: string;

  @ApiProperty()
  country: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class OrderStatusHistoryResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  orderId: string;

  @ApiProperty({ enum: OrderStatus })
  status: OrderStatus;

  @ApiPropertyOptional({ nullable: true })
  note: string | null;

  @ApiPropertyOptional({ nullable: true })
  changedBy: string | null;

  @ApiProperty()
  createdAt: Date;
}

export class OrderSummaryResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  orderNumber: string;

  @ApiPropertyOptional({ nullable: true })
  userId: string | null;

  @ApiPropertyOptional({ nullable: true })
  guestEmail: string | null;

  @ApiPropertyOptional({ nullable: true })
  guestPhone: string | null;

  @ApiPropertyOptional({ nullable: true })
  guestFirstName: string | null;

  @ApiPropertyOptional({ nullable: true })
  guestLastName: string | null;

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

  @ApiPropertyOptional({ nullable: true })
  customerNote: string | null;

  @ApiPropertyOptional({ nullable: true })
  shippingMethod: string | null;

  @ApiPropertyOptional({ nullable: true })
  shippingCarrier: string | null;

  @ApiPropertyOptional({ nullable: true })
  trackingNumber: string | null;

  @ApiPropertyOptional({ nullable: true })
  trackingUrl: string | null;

  @ApiPropertyOptional({ nullable: true })
  paidAt: Date | null;

  @ApiPropertyOptional({ nullable: true })
  cancelledAt: Date | null;

  @ApiPropertyOptional({ nullable: true })
  completedAt: Date | null;

  @ApiPropertyOptional({ nullable: true })
  estimatedDelivery: Date | null;

  @ApiPropertyOptional({ nullable: true })
  actualDelivery: Date | null;

  @ApiProperty({ type: [OrderItemResponseDto] })
  items: OrderItemResponseDto[];

  @ApiPropertyOptional({ type: OrderPaymentResponseDto, nullable: true })
  payment: OrderPaymentResponseDto | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class OrderDetailResponseDto extends OrderSummaryResponseDto {
  @ApiPropertyOptional({ type: OrderCustomerResponseDto, nullable: true })
  user?: OrderCustomerResponseDto | null;

  @ApiPropertyOptional({ type: OrderAddressResponseDto, nullable: true })
  shippingAddress?: OrderAddressResponseDto | null;

  @ApiPropertyOptional({ type: OrderAddressResponseDto, nullable: true })
  billingAddress?: OrderAddressResponseDto | null;

  @ApiProperty({ type: [OrderStatusHistoryResponseDto] })
  statusHistory: OrderStatusHistoryResponseDto[];
}
