import { Type, plainToInstance } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
  validateSync,
} from 'class-validator';

const NODE_ENVIRONMENTS = ['development', 'test', 'production'] as const;

type NodeEnvironment = (typeof NODE_ENVIRONMENTS)[number];

export class EnvironmentVariables {
  @IsOptional()
  @IsIn(NODE_ENVIRONMENTS)
  NODE_ENV?: NodeEnvironment;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  PORT?: number;

  @IsString()
  @MinLength(32, {
    message: 'JWT_SECRET must be at least 32 characters',
  })
  JWT_SECRET: string;

  @IsString()
  JWT_EXPIRES_IN: string;

  @IsString()
  @MinLength(32, {
    message: 'JWT_REFRESH_SECRET must be at least 32 characters',
  })
  JWT_REFRESH_SECRET: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  SESSION_EXPIRES_DAYS: number;

  @IsString()
  DATABASE_URL: string;

  @IsOptional()
  @IsString()
  CORS_ORIGINS?: string;

  @IsOptional()
  @IsIn(['true', 'false'])
  SWAGGER_ENABLED?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  TRUST_PROXY_HOPS?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1000)
  RATE_LIMIT_TTL_MS?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  RATE_LIMIT_MAX?: number;
}

export function validate(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  const environment = validatedConfig.NODE_ENV ?? 'development';

  const corsOrigins =
    validatedConfig.CORS_ORIGINS?.split(',')
      .map((origin) => origin.trim())
      .filter(Boolean) ?? [];

  if (corsOrigins.includes('*')) {
    throw new Error(
      'CORS_ORIGINS cannot contain "*". Add explicit trusted origins.',
    );
  }

  if (environment === 'production' && corsOrigins.length === 0) {
    throw new Error('CORS_ORIGINS is required when NODE_ENV=production.');
  }

  return validatedConfig;
}
