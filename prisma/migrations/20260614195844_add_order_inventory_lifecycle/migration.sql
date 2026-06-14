-- CreateEnum
CREATE TYPE "OrderInventoryStatus" AS ENUM ('RESERVED', 'COMMITTED', 'RELEASED');

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "inventoryCommittedAt" TIMESTAMP(3),
ADD COLUMN     "inventoryExpiresAt" TIMESTAMP(3),
ADD COLUMN     "inventoryReleasedAt" TIMESTAMP(3),
ADD COLUMN     "inventoryReservedAt" TIMESTAMP(3),
ADD COLUMN     "inventoryStatus" "OrderInventoryStatus" NOT NULL DEFAULT 'RESERVED';
