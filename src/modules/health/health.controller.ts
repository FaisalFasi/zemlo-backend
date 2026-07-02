import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';
import {
  ApiOkResponse,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';

import {
  LivenessResponseDto,
  ReadinessResponseDto,
} from './dto/health-response.dto';
import { DatabaseHealthIndicator } from './indicators/database-health.indicator';

@ApiTags('Health')
@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(
    private readonly healthCheckService: HealthCheckService,
    private readonly databaseHealthIndicator: DatabaseHealthIndicator,
  ) {}

  @Get('live')
  @ApiOkResponse({
    description: 'Application process is running',
    type: LivenessResponseDto,
  })
  live(): LivenessResponseDto {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
    };
  }

  @Get('ready')
  @HealthCheck()
  @ApiOkResponse({
    description: 'Application and database are ready',
    type: ReadinessResponseDto,
  })
  @ApiServiceUnavailableResponse({
    description: 'Application dependency is unavailable',
    type: ReadinessResponseDto,
  })
  async ready(): Promise<ReadinessResponseDto> {
    const result = await this.healthCheckService.check([
      () => this.databaseHealthIndicator.isHealthy(),
    ]);

    return {
      status: result.status,
      info: result.info ?? null,
      error: result.error ?? null,
      details: result.details,
    };
  }
}
