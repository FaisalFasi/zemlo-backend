import { PrismaClient } from '@prisma/client';

export async function seedPlatformSettings(prisma: PrismaClient) {
  console.log('⚙️ Creating platform settings...');

  await prisma.platformSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',

      storeName: 'Zemlo',
      storeEmail: 'support@zemlo.com',
      supportPhone: null,
      supportWhatsapp: null,

      businessCountry: 'US',

      currency: 'USD',
      taxRate: 0,
      defaultShippingCost: 0,
      freeShippingOver: null,

      allowGuestCheckout: true,
      requireEmailVerification: false,
      allowAccountRegistration: true,

      enableReviews: false,
      enableWishlist: false,
      enableCoupons: false,
      enableChat: false,
      maintenanceMode: false,

      homepageTitle: 'Zemlo',
      homepageDescription: 'Shop quality products from Zemlo.',
      announcementEnabled: false,
    },
  });

  console.log('✅ Platform settings ready');
}
