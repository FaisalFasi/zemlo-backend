-- CreateEnum
CREATE TYPE "StripeWebhookEventStatus" AS ENUM ('PROCESSING', 'PROCESSED', 'FAILED', 'IGNORED');

-- CreateTable
CREATE TABLE "stripe_webhook_events" (
    "id" TEXT NOT NULL,
    "stripeEventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "objectId" TEXT,
    "paymentIntentId" TEXT,
    "status" "StripeWebhookEventStatus" NOT NULL DEFAULT 'PROCESSING',
    "payload" JSONB,
    "failureReason" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stripe_webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "stripe_webhook_events_stripeEventId_key" ON "stripe_webhook_events"("stripeEventId");

-- CreateIndex
CREATE INDEX "stripe_webhook_events_eventType_idx" ON "stripe_webhook_events"("eventType");

-- CreateIndex
CREATE INDEX "stripe_webhook_events_objectId_idx" ON "stripe_webhook_events"("objectId");

-- CreateIndex
CREATE INDEX "stripe_webhook_events_paymentIntentId_idx" ON "stripe_webhook_events"("paymentIntentId");

-- CreateIndex
CREATE INDEX "stripe_webhook_events_status_idx" ON "stripe_webhook_events"("status");

-- CreateIndex
CREATE INDEX "stripe_webhook_events_createdAt_idx" ON "stripe_webhook_events"("createdAt");
