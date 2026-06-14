-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "failedAt" TIMESTAMP(3),
ADD COLUMN     "refundedAt" TIMESTAMP(3);
