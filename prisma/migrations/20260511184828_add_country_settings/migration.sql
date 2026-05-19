-- CreateTable
CREATE TABLE "country_settings" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "iso2" TEXT NOT NULL,
    "iso3" TEXT,
    "currency" TEXT,
    "phoneCode" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "allowWebsiteAccess" BOOLEAN NOT NULL DEFAULT true,
    "allowCheckout" BOOLEAN NOT NULL DEFAULT true,
    "allowShipping" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "country_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "country_settings_iso2_key" ON "country_settings"("iso2");

-- CreateIndex
CREATE UNIQUE INDEX "country_settings_iso3_key" ON "country_settings"("iso3");

-- CreateIndex
CREATE INDEX "country_settings_iso2_idx" ON "country_settings"("iso2");

-- CreateIndex
CREATE INDEX "country_settings_isActive_idx" ON "country_settings"("isActive");

-- CreateIndex
CREATE INDEX "country_settings_allowWebsiteAccess_idx" ON "country_settings"("allowWebsiteAccess");

-- CreateIndex
CREATE INDEX "country_settings_allowCheckout_idx" ON "country_settings"("allowCheckout");

-- CreateIndex
CREATE INDEX "country_settings_allowShipping_idx" ON "country_settings"("allowShipping");
