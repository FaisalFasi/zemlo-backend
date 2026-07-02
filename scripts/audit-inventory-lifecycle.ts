import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  OrderInventoryStatus,
  OrderStatus,
  PaymentStatus,
  Prisma,
} from '@prisma/client';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

const logger = new Logger('InventoryLifecycleAudit');

type AuditIssue = {
  severity: 'BLOCKER' | 'WARNING';
  message: string;
  count: number;
};

async function countOrders(
  prisma: PrismaService,
  where: Prisma.OrderWhereInput,
): Promise<number> {
  return prisma.order.count({ where });
}

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  const prisma = app.get(PrismaService);
  const now = new Date();

  const issues: AuditIssue[] = [];

  const paidNotCommitted = await countOrders(prisma, {
    paymentStatus: PaymentStatus.PAID,
    inventoryStatus: {
      not: OrderInventoryStatus.COMMITTED,
    },
  });

  if (paidNotCommitted > 0) {
    issues.push({
      severity: 'BLOCKER',
      message: 'Paid orders must have COMMITTED inventory.',
      count: paidNotCommitted,
    });
  }

  const committedWithoutTimestamp = await countOrders(prisma, {
    inventoryStatus: OrderInventoryStatus.COMMITTED,
    inventoryCommittedAt: null,
  });

  if (committedWithoutTimestamp > 0) {
    issues.push({
      severity: 'BLOCKER',
      message: 'COMMITTED inventory orders must have inventoryCommittedAt.',
      count: committedWithoutTimestamp,
    });
  }

  const releasedWithoutTimestamp = await countOrders(prisma, {
    inventoryStatus: OrderInventoryStatus.RELEASED,
    inventoryReleasedAt: null,
  });

  if (releasedWithoutTimestamp > 0) {
    issues.push({
      severity: 'BLOCKER',
      message: 'RELEASED inventory orders must have inventoryReleasedAt.',
      count: releasedWithoutTimestamp,
    });
  }

  const reservedWithoutTimestamp = await countOrders(prisma, {
    inventoryStatus: OrderInventoryStatus.RESERVED,
    inventoryReservedAt: null,
  });

  if (reservedWithoutTimestamp > 0) {
    issues.push({
      severity: 'BLOCKER',
      message: 'RESERVED inventory orders must have inventoryReservedAt.',
      count: reservedWithoutTimestamp,
    });
  }

  const cancelledOrExpiredStillReserved = await countOrders(prisma, {
    status: {
      in: [OrderStatus.CANCELLED, OrderStatus.EXPIRED],
    },
    inventoryStatus: OrderInventoryStatus.RESERVED,
  });

  if (cancelledOrExpiredStillReserved > 0) {
    issues.push({
      severity: 'BLOCKER',
      message: 'Cancelled/expired orders must not keep RESERVED inventory.',
      count: cancelledOrExpiredStillReserved,
    });
  }

  const failedCancelledExpiredPaymentStillReserved = await countOrders(prisma, {
    paymentStatus: {
      in: [
        PaymentStatus.FAILED,
        PaymentStatus.CANCELLED,
        PaymentStatus.EXPIRED,
      ],
    },
    inventoryStatus: OrderInventoryStatus.RESERVED,
  });

  if (failedCancelledExpiredPaymentStillReserved > 0) {
    issues.push({
      severity: 'BLOCKER',
      message:
        'FAILED/CANCELLED/EXPIRED payment orders must not keep RESERVED inventory.',
      count: failedCancelledExpiredPaymentStillReserved,
    });
  }

  const expiredReservedOrders = await countOrders(prisma, {
    inventoryStatus: OrderInventoryStatus.RESERVED,
    paymentStatus: PaymentStatus.PENDING,
    inventoryExpiresAt: {
      not: null,
      lte: now,
    },
  });

  if (expiredReservedOrders > 0) {
    issues.push({
      severity: 'WARNING',
      message:
        'Expired RESERVED orders found. Run inventory:release-expired to release stock.',
      count: expiredReservedOrders,
    });
  }

  const blockers = issues.filter((issue) => issue.severity === 'BLOCKER');
  const warnings = issues.filter((issue) => issue.severity === 'WARNING');

  for (const issue of warnings) {
    logger.warn(`${issue.message} count=${issue.count}`);
  }

  for (const issue of blockers) {
    logger.error(`${issue.message} count=${issue.count}`);
  }

  await app.close();

  if (blockers.length > 0) {
    process.exit(1);
  }

  logger.log('✅ Inventory lifecycle audit passed.');
}

main().catch((error) => {
  logger.error(error instanceof Error ? error.stack : String(error));
  process.exit(1);
});
