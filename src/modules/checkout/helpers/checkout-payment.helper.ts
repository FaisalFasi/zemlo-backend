import { PaymentMethod } from '@prisma/client';

export const ALLOWED_CHECKOUT_PAYMENT_METHODS: PaymentMethod[] = [
  PaymentMethod.CASH_ON_DELIVERY,
  PaymentMethod.MANUAL,
];
