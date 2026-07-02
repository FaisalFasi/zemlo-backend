import { ApiProperty } from '@nestjs/swagger';

export class LivenessResponseDto {
  @ApiProperty({
    type: String,
    enum: ['ok'],
    example: 'ok',
  })
  status: 'ok';

  @ApiProperty({
    type: String,
    format: 'date-time',
    example: '2026-06-17T12:00:00.000Z',
  })
  timestamp: string;

  @ApiProperty({
    type: Number,
    example: 120,
    minimum: 0,
    description: 'Application uptime in seconds',
  })
  uptimeSeconds: number;
}

export class ReadinessResponseDto {
  @ApiProperty({
    type: String,
    enum: ['ok', 'error', 'shutting_down'],
    example: 'ok',
  })
  status: 'ok' | 'error' | 'shutting_down';

  @ApiProperty({
    type: Object,
    nullable: true,
    example: {
      database: {
        status: 'up',
      },
    },
  })
  info: Record<string, unknown> | null;

  @ApiProperty({
    type: Object,
    nullable: true,
    example: null,
  })
  error: Record<string, unknown> | null;

  @ApiProperty({
    type: Object,
    example: {
      database: {
        status: 'up',
      },
    },
  })
  details: Record<string, unknown>;
}
