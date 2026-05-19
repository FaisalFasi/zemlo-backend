import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PublicSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getPublicSettings() {
    const [settings, countries, paymentMethods] = await Promise.all([
      this.prisma.platformSettings.findUnique({
        where: {
          id: 'default',
        },
      }),

      this.prisma.countrySetting.findMany({
        where: {
          isActive: true,
          allowWebsiteAccess: true,
        },
        orderBy: [
          {
            sortOrder: Prisma.SortOrder.asc,
          },
          {
            name: Prisma.SortOrder.asc,
          },
        ],
        select: {
          id: true,
          name: true,
          iso2: true,
          iso3: true,
          currency: true,
          phoneCode: true,
          allowCheckout: true,
          allowShipping: true,
          isDefault: true,
        },
      }),

      this.prisma.paymentMethodSetting.findMany({
        where: {
          isEnabled: true,
        },
        orderBy: {
          sortOrder: Prisma.SortOrder.asc,
        },
        select: {
          method: true,
          label: true,
          description: true,
          isOnline: true,
          minAmount: true,
          maxAmount: true,
        },
      }),
    ]);

    return {
      store: {
        name: settings?.storeName ?? 'Zemlo',
        email: settings?.storeEmail ?? null,
        logoUrl: settings?.storeLogoUrl ?? null,
        faviconUrl: settings?.storeFaviconUrl ?? null,
        supportPhone: settings?.supportPhone ?? null,
        supportWhatsapp: settings?.supportWhatsapp ?? null,
      },

      homepage: {
        title: settings?.homepageTitle ?? 'Zemlo',
        description:
          settings?.homepageDescription ?? 'Shop quality products from Zemlo.',
      },

      announcement: {
        enabled: settings?.announcementEnabled ?? false,
        text: settings?.announcementText ?? null,
      },

      features: {
        guestCheckout: settings?.allowGuestCheckout ?? true,
        accountRegistration: settings?.allowAccountRegistration ?? true,
        reviews: settings?.enableReviews ?? false,
        wishlist: settings?.enableWishlist ?? false,
        coupons: settings?.enableCoupons ?? false,
        chat: settings?.enableChat ?? false,
      },

      commerce: {
        currency: settings?.currency ?? 'USD',
        taxRate: settings?.taxRate ?? 0,
        defaultShippingCost: settings?.defaultShippingCost ?? 0,
        freeShippingOver: settings?.freeShippingOver ?? null,
      },

      countries,

      paymentMethods,

      social: {
        instagramUrl: settings?.instagramUrl ?? null,
        facebookUrl: settings?.facebookUrl ?? null,
        tiktokUrl: settings?.tiktokUrl ?? null,
        youtubeUrl: settings?.youtubeUrl ?? null,
      },

      maintenanceMode: settings?.maintenanceMode ?? false,
    };
  }
}
