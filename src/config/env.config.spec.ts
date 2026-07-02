import { validate } from './env.config';

describe('Environment security validation', () => {
  const baseEnvironment = {
    JWT_SECRET: 'a'.repeat(32),
    JWT_EXPIRES_IN: '7d',
    JWT_REFRESH_SECRET: 'b'.repeat(32),
    SESSION_EXPIRES_DAYS: '7',
    DATABASE_URL: 'postgresql://user:password@localhost:5432/db',
  };

  it('requires explicit CORS origins in production', () => {
    expect(() =>
      validate({
        ...baseEnvironment,
        NODE_ENV: 'production',
      }),
    ).toThrow('CORS_ORIGINS is required when NODE_ENV=production');
  });

  it('rejects wildcard CORS configuration', () => {
    expect(() =>
      validate({
        ...baseEnvironment,
        NODE_ENV: 'production',
        CORS_ORIGINS: '*',
      }),
    ).toThrow('CORS_ORIGINS cannot contain "*"');
  });

  it('accepts explicit production security configuration', () => {
    const result = validate({
      ...baseEnvironment,
      NODE_ENV: 'production',
      PORT: '3000',
      CORS_ORIGINS: 'https://shop.example.com,https://admin.example.com',
      SWAGGER_ENABLED: 'false',
      TRUST_PROXY_HOPS: '1',
      RATE_LIMIT_TTL_MS: '60000',
      RATE_LIMIT_MAX: '120',
    });

    expect(result.NODE_ENV).toBe('production');
    expect(result.PORT).toBe(3000);
    expect(result.TRUST_PROXY_HOPS).toBe(1);
    expect(result.RATE_LIMIT_MAX).toBe(120);
  });
});
