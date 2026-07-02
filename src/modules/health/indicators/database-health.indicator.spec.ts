import { PrismaService } from '../../../prisma/prisma.service';
import { DatabaseHealthIndicator } from './database-health.indicator';

describe('DatabaseHealthIndicator', () => {
  const prismaMock = {
    $queryRaw: jest.fn(),
  };

  const indicatorMock = {
    up: jest.fn(),
    down: jest.fn(),
  };

  const healthIndicatorServiceMock = {
    check: jest.fn(),
  };

  let indicator: DatabaseHealthIndicator;

  beforeEach(() => {
    jest.clearAllMocks();

    healthIndicatorServiceMock.check.mockReturnValue(indicatorMock);

    indicator = new DatabaseHealthIndicator(
      prismaMock as unknown as PrismaService,
      healthIndicatorServiceMock,
    );
  });

  it('reports the database as up when the query succeeds', async () => {
    prismaMock.$queryRaw.mockResolvedValue([{ value: 1 }]);

    indicatorMock.up.mockReturnValue({
      database: {
        status: 'up',
      },
    });

    await expect(indicator.isHealthy()).resolves.toEqual({
      database: {
        status: 'up',
      },
    });

    expect(indicatorMock.up).toHaveBeenCalledTimes(1);
    expect(indicatorMock.down).not.toHaveBeenCalled();
  });

  it('reports the database as down when the query fails', async () => {
    prismaMock.$queryRaw.mockRejectedValue(new Error('Database unavailable'));

    indicatorMock.down.mockReturnValue({
      database: {
        status: 'down',
        message: 'Database unavailable',
      },
    });

    await expect(indicator.isHealthy()).resolves.toEqual({
      database: {
        status: 'down',
        message: 'Database unavailable',
      },
    });

    expect(indicatorMock.down).toHaveBeenCalledWith({
      message: 'Database unavailable',
    });
  });
});
