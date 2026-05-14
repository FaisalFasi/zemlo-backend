import { PrismaClient } from '@prisma/client';

export async function seedCountries(prisma: PrismaClient) {
  console.log('🌍 Creating default country settings...');

  const countriesData = [
    {
      name: 'United States',
      iso2: 'US',
      iso3: 'USA',
      currency: 'USD',
      phoneCode: '+1',
      isActive: true,
      allowWebsiteAccess: true,
      allowCheckout: true,
      allowShipping: true,
      isDefault: true,
      sortOrder: 1,
    },
    {
      name: 'Germany',
      iso2: 'DE',
      iso3: 'DEU',
      currency: 'EUR',
      phoneCode: '+49',
      isActive: true,
      allowWebsiteAccess: true,
      allowCheckout: true,
      allowShipping: true,
      isDefault: false,
      sortOrder: 2,
    },
  ];

  for (const country of countriesData) {
    if (country.isDefault) {
      await prisma.countrySetting.updateMany({
        where: {
          isDefault: true,
          iso2: {
            not: country.iso2,
          },
        },
        data: {
          isDefault: false,
        },
      });
    }

    await prisma.countrySetting.upsert({
      where: {
        iso2: country.iso2,
      },
      update: {
        name: country.name,
        iso3: country.iso3,
        currency: country.currency,
        phoneCode: country.phoneCode,
        isActive: country.isActive,
        allowWebsiteAccess: country.allowWebsiteAccess,
        allowCheckout: country.allowCheckout,
        allowShipping: country.allowShipping,
        isDefault: country.isDefault,
        sortOrder: country.sortOrder,
      },
      create: country,
    });
  }

  console.log(`✅ Created/verified ${countriesData.length} countries`);
}
