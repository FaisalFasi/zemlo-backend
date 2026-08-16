-- CreateIndex
CREATE INDEX "products_price_idx" ON "products"("price");

-- CreateIndex
CREATE INDEX "products_status_isFeatured_createdAt_idx" ON "products"("status", "isFeatured", "createdAt");

-- CreateIndex
CREATE INDEX "users_resetPasswordToken_idx" ON "users"("resetPasswordToken");
