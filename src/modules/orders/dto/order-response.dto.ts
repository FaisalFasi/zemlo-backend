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
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String })
  email: string;

  @ApiProperty({ type: String })
  firstName: string;

  @ApiProperty({ type: String })
  lastName: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  phone?: string | null;

  @ApiProperty({ enum: UserRole })
  role: UserRole;
}

export class OrderProductSummaryResponseDto {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String })
  name: string;

  @ApiProperty({ type: String })
  slug: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  sku?: string | null;
}

export class OrderVariantSummaryResponseDto {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String })
  name: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  sku: string | null;
}

export class OrderItemResponseDto {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String })
  orderId: string;

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
  productSnapshot: unknown | null;

  @ApiPropertyOptional({ type: OrderProductSummaryResponseDto, nullable: true })
  product?: OrderProductSummaryResponseDto | null;

  @ApiPropertyOptional({ type: OrderVariantSummaryResponseDto, nullable: true })
  variant?: OrderVariantSummaryResponseDto | null;

  @ApiProperty({ type: Date })
  createdAt: Date;

  @ApiProperty({ type: Date })
  updatedAt: Date;
}

export class OrderPaymentResponseDto {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String })
  orderId: string;

  @ApiProperty({ enum: PaymentMethod })
  method: PaymentMethod;

  @ApiProperty({ enum: PaymentStatus })
  status: PaymentStatus;

  @ApiProperty({ type: Number })
  amount: number;

  @ApiProperty({ type: String })
  currency: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  transactionId: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  paymentIntentId: string | null;

  @ApiPropertyOptional({ type: Date, nullable: true })
  paidAt: Date | null;

  @ApiPropertyOptional({ type: Date, nullable: true })
  failedAt: Date | null;

  @ApiPropertyOptional({ type: Date, nullable: true })
  refundedAt: Date | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  failureReason: string | null;

  @ApiPropertyOptional({ type: Object, nullable: true })
  gatewayResponse: unknown | null;

  @ApiPropertyOptional({ type: Object, nullable: true })
  metadata: unknown | null;

  @ApiProperty({ type: Date })
  createdAt: Date;

  @ApiProperty({ type: Date })
  updatedAt: Date;
}

export class OrderAddressResponseDto {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String })
  orderId: string;

  @ApiProperty({ enum: AddressType })
  type: AddressType;

  @ApiProperty({ type: String })
  firstName: string;

  @ApiProperty({ type: String })
  lastName: string;

  @ApiProperty({ type: String })
  phone: string;

  @ApiProperty({ type: String })
  street: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  apartment: string | null;

  @ApiProperty({ type: String })
  city: string;

  @ApiProperty({ type: String })
  state: string;

  @ApiProperty({ type: String })
  zipCode: string;

  @ApiProperty({ type: String })
  country: string;

  @ApiProperty({ type: Date })
  createdAt: Date;

  @ApiProperty({ type: Date })
  updatedAt: Date;
}

export class OrderStatusHistoryResponseDto {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String })
  orderId: string;

  @ApiProperty({ enum: OrderStatus })
  status: OrderStatus;

  @ApiPropertyOptional({ type: String, nullable: true })
  note: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  changedBy: string | null;

  @ApiProperty({ type: Date })
  createdAt: Date;
}

export class OrderSummaryResponseDto {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String })
  orderNumber: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  userId: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  guestEmail: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  guestPhone: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  guestFirstName: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  guestLastName: string | null;

  @ApiProperty({ enum: OrderStatus })
  status: OrderStatus;

  @ApiProperty({ enum: PaymentStatus })
  paymentStatus: PaymentStatus;

  @ApiProperty({ enum: FulfillmentStatus })
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

  @ApiPropertyOptional({ type: String, nullable: true })
  customerNote: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  shippingMethod: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  shippingCarrier: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  trackingNumber: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  trackingUrl: string | null;

  @ApiPropertyOptional({ type: Date, nullable: true })
  paidAt: Date | null;

  @ApiPropertyOptional({ type: Date, nullable: true })
  cancelledAt: Date | null;

  @ApiPropertyOptional({ type: Date, nullable: true })
  completedAt: Date | null;

  @ApiPropertyOptional({ type: Date, nullable: true })
  estimatedDelivery: Date | null;

  @ApiPropertyOptional({ type: Date, nullable: true })
  actualDelivery: Date | null;

  @ApiProperty({ type: [OrderItemResponseDto] })
  items: OrderItemResponseDto[];

  @ApiPropertyOptional({ type: OrderPaymentResponseDto, nullable: true })
  payment: OrderPaymentResponseDto | null;

  @ApiProperty({ type: Date })
  createdAt: Date;

  @ApiProperty({ type: Date })
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
