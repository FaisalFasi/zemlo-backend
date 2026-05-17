/*
  Warnings:

  - You are about to drop the column `sessionId` on the `carts` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[guestId]` on the table `carts` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "carts" DROP CONSTRAINT "carts_sessionId_fkey";

-- DropIndex
DROP INDEX "carts_sessionId_idx";

-- DropIndex
DROP INDEX "carts_sessionId_key";

-- AlterTable
ALTER TABLE "carts" DROP COLUMN "sessionId",
ADD COLUMN     "guestId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "carts_guestId_key" ON "carts"("guestId");

-- CreateIndex
CREATE INDEX "carts_guestId_idx" ON "carts"("guestId");
