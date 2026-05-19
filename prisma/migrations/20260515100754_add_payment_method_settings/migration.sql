-- CreateTable
CREATE TABLE "payment_method_settings" (
    "id" TEXT NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "minAmount" DECIMAL(10,2),
    "maxAmount" DECIMAL(10,2),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_method_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payment_method_settings_method_key" ON "payment_method_settings"("method");

-- CreateIndex
CREATE INDEX "payment_method_settings_isEnabled_idx" ON "payment_method_settings"("isEnabled");

-- CreateIndex
CREATE INDEX "payment_method_settings_sortOrder_idx" ON "payment_method_settings"("sortOrder");
