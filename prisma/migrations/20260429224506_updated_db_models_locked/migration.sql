/*
  Warnings:

  - You are about to drop the `_CartItemToSession` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[sessionId]` on the table `wishlists` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "_CartItemToSession" DROP CONSTRAINT "_CartItemToSession_A_fkey";

-- DropForeignKey
ALTER TABLE "_CartItemToSession" DROP CONSTRAINT "_CartItemToSession_B_fkey";

-- DropForeignKey
ALTER TABLE "sessions" DROP CONSTRAINT "sessions_userId_fkey";

-- AlterTable
ALTER TABLE "sessions" ADD COLUMN     "cartItemId" TEXT;

-- AlterTable
ALTER TABLE "wishlists" ADD COLUMN     "sessionId" TEXT,
ALTER COLUMN "userId" DROP NOT NULL;

-- DropTable
DROP TABLE "_CartItemToSession";

-- CreateIndex
CREATE UNIQUE INDEX "wishlists_sessionId_key" ON "wishlists"("sessionId");

-- AddForeignKey
ALTER TABLE "wishlists" ADD CONSTRAINT "wishlists_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_cartItemId_fkey" FOREIGN KEY ("cartItemId") REFERENCES "cart_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
