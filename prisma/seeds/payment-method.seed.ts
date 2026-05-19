import { PaymentMethod, PrismaClient } from '@prisma/client';

export async function seedPaymentMethods(prisma: PrismaClient) {
  console.log('💳 Creating payment method settings...');

  const paymentMethods = [
    {
      method: PaymentMethod.MANUAL,
      label: 'Manual Payment',
      description: 'Manual payment method for development/testing.',
      isEnabled: true,
      isOnline: false,
      sortOrder: 1,
    },
    {
      method: PaymentMethod.CASH_ON_DELIVERY,
      label: 'Cash on Delivery',
      description: 'Customer pays when order is delivered.',
      isEnabled: false,
      isOnline: false,
      sortOrder: 2,
    },
    {
      method: PaymentMethod.STRIPE,
      label: 'Stripe',
      description: 'Online card payment using Stripe.',
      isEnabled: false,
      isOnline: true,
      sortOrder: 3,
    },
    {
      method: PaymentMethod.PAYPAL,
      label: 'PayPal',
      description: 'Online payment using PayPal.',
      isEnabled: false,
      isOnline: true,
      sortOrder: 4,
    },
    {
      method: PaymentMethod.BANK_TRANSFER,
      label: 'Bank Transfer',
      description: 'Customer pays by bank transfer.',
      isEnabled: false,
      isOnline: false,
      sortOrder: 5,
    },
    {
      method: PaymentMethod.CREDIT_CARD,
      label: 'Card Payment',
      description: 'Direct card payment.',
      isEnabled: false,
      isOnline: true,
      sortOrder: 6,
    },
  ];

  for (const paymentMethod of paymentMethods) {
    await prisma.paymentMethodSetting.upsert({
      where: {
        method: paymentMethod.method,
      },
      update: {
        label: paymentMethod.label,
        description: paymentMethod.description,
        isOnline: paymentMethod.isOnline,
        sortOrder: paymentMethod.sortOrder,
      },
      create: paymentMethod,
    });
  }

  console.log(`✅ Created/verified ${paymentMethods.length} payment methods`);
}
