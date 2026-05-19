import { plainToClass } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
  validateSync,
} from 'class-validator';

export class EnvironmentVariables {
  // JWT Config
  @IsString()
  @MinLength(32, { message: 'JWT_SECRET must be at least 32 characters' })
  JWT_SECRET: string;

  @IsString()
  JWT_EXPIRES_IN: string;

  @IsString()
  JWT_REFRESH_SECRET: string;

  @IsNumber()
  SESSION_EXPIRES_DAYS: number;

  // Database
  @IsString()
  DATABASE_URL: string;

  // Stripe
  @IsOptional()
  @IsString()
  STRIPE_SECRET_KEY?: string;

  @IsOptional()
  @IsString()
  STRIPE_PUBLISHABLE_KEY?: string;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToClass(EnvironmentVariables, config, {
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
