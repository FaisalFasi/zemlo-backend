import { Type, plainToInstance } from 'class-transformer';
import {
  IsNumber,
  IsString,
  Min,
  MinLength,
  validateSync,
} from 'class-validator';

export class EnvironmentVariables {
  // JWT Config
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
  @IsNumber()
  @Min(1)
  SESSION_EXPIRES_DAYS: number;

  // Database
  @IsString()
  DATABASE_URL: string;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  return validatedConfig;
}

// ✅ DEBUG: Dekho config me kya aata hai
//   console.log('🔍 Config received:', Object.keys(config));
//   console.log('📌 JWT_SECRET:', config.JWT_SECRET);
//   console.log('📌 DATABASE_URL:', config.DATABASE_URL);
