import type { HealthCheckResult, HealthCheckService } from '@nestjs/terminus';

import { HealthController } from './health.controller';
import type { ReadinessResponseDto } from './dto/health-response.dto';
import type { DatabaseHealthIndicator } from './indicators/database-health.indicator';

describe('HealthController', () => {
  const healthCheckServiceMock = {
    check: jest.fn(),
  };

  const databaseHealthIndicatorMock = {
    isHealthy: jest.fn(),
  };

  let controller: HealthController;

  beforeEach(() => {
    jest.clearAllMocks();

    controller = new HealthController(
      healthCheckServiceMock as unknown as HealthCheckService,
      databaseHealthIndicatorMock as unknown as DatabaseHealthIndicator,
    );
  });

  it('returns application liveness information', () => {
    const result = controller.live();

    expect(result.status).toBe('ok');
    expect(result.timestamp).toEqual(expect.any(String));
    expect(result.uptimeSeconds).toEqual(expect.any(Number));
  });

  it('checks database readiness', async () => {
    const healthCheckResult: HealthCheckResult = {
      status: 'ok',
      info: {
        database: {
          status: 'up',
        },
      },
      error: {},
      details: {
        database: {
          status: 'up',
        },
      },
    };

    const expectedResult: ReadinessResponseDto = {
      status: 'ok',
      info: {
        database: {
          status: 'up',
        },
      },
      error: {},
      details: {
        database: {
          status: 'up',
        },
      },
    };

    databaseHealthIndicatorMock.isHealthy.mockResolvedValue({
      database: {
        status: 'up',
      },
    });

    healthCheckServiceMock.check.mockImplementation(
      async (checks: Array<() => Promise<unknown>>) => {
        await checks[0]();

        return healthCheckResult;
      },
    );

    await expect(controller.ready()).resolves.toEqual(expectedResult);

    expect(healthCheckServiceMock.check).toHaveBeenCalledTimes(1);
    expect(databaseHealthIndicatorMock.isHealthy).toHaveBeenCalledTimes(1);
  });

  it('normalizes missing readiness fields to null', async () => {
    const healthCheckResult = {
      status: 'ok',
      details: {
        database: {
          status: 'up',
        },
      },
    } as HealthCheckResult;

    healthCheckServiceMock.check.mockResolvedValue(healthCheckResult);

    await expect(controller.ready()).resolves.toEqual({
      status: 'ok',
      info: null,
      error: null,
      details: {
        database: {
          status: 'up',
        },
      },
    });
  });
});
