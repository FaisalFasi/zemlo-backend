import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';

import { ExpiredReservationReleaseService } from './expired-reservation-release.service';

@Injectable()
export class InventoryReleaseCron {
  private readonly logger = new Logger(InventoryReleaseCron.name);

  constructor(
    @Inject(ExpiredReservationReleaseService)
    private readonly expiredReservationRelease: ExpiredReservationReleaseService,
    @Inject(ConfigService)
    private readonly configService: ConfigService,
  ) {}

  // Every 5 minutes is plenty against a >=20-minute reservation window
  // (see `checkout.inventoryReservationMinutes`).
  @Cron(CronExpression.EVERY_5_MINUTES)
  async releaseExpired() {
    const enabled = this.configService.get<boolean>(
      'inventory.expiredReservationRelease.enabled',
      true,
    );

    if (!enabled) {
      return;
    }

    const limit = this.configService.get<number>(
      'inventory.expiredReservationRelease.batchLimit',
      50,
    );

    const result = await this.expiredReservationRelease.release({ limit });

    if (result.releasedCount > 0 || result.skippedCount > 0) {
      this.logger.log(
        `Released ${result.releasedCount}/${result.checkedCount} expired reservations (${result.skippedCount} skipped)`,
      );
    }
  }
}
