import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from '../src/app.module';
import { ExpiredReservationReleaseService } from '../src/modules/payments/services/expired-reservation-release.service';

const logger = new Logger('ReleaseExpiredInventoryReservations');

function getArgValue(name: string): string | undefined {
  const prefix = `--${name}=`;
  const arg = process.argv.find((item) => item.startsWith(prefix));

  return arg?.slice(prefix.length);
}

function getLimit(): number {
  const rawLimit = getArgValue('limit');

  if (!rawLimit) {
    return 50;
  }

  const limit = Number(rawLimit);

  if (!Number.isInteger(limit) || limit <= 0 || limit > 500) {
    throw new Error('--limit must be an integer between 1 and 500');
  }

  return limit;
}

function isDryRun(): boolean {
  return process.argv.includes('--dry-run');
}

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  const expiredReservationRelease = app.get(ExpiredReservationReleaseService);

  const limit = getLimit();
  const dryRun = isDryRun();

  const result = await expiredReservationRelease.release({ limit, dryRun });

  if (dryRun) {
    logger.log(
      `DRY RUN: ${result.checkedCount} reservation(s) are expired and would be released.`,
    );
  } else {
    logger.log(
      `Expired reservation cleanup complete. checked=${result.checkedCount}, released=${result.releasedCount}, skipped=${result.skippedCount}`,
    );
  }

  await app.close();
}

main().catch((error) => {
  logger.error(error instanceof Error ? error.stack : String(error));
  process.exit(1);
});
