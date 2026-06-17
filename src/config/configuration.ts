function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) {
    return fallback;
  }

  return value === 'true';
}

function parseInteger(value: string | undefined, fallback: number): number {
  const parsedValue = Number.parseInt(value ?? '', 10);

  return Number.isNaN(parsedValue) ? fallback : parsedValue;
}

function parseCsv(value: string | undefined): string[] {
  return (
    value
      ?.split(',')
      .map((item) => item.trim())
      .filter(Boolean) ?? []
  );
}

export default () => {
  const environment = process.env.NODE_ENV ?? 'development';

  return {
    app: {
      environment,
    },

    http: {
      port: parseInteger(process.env.PORT, 3000),
      corsOrigins: parseCsv(process.env.CORS_ORIGINS),
      trustProxyHops: parseInteger(process.env.TRUST_PROXY_HOPS, 0),
    },

    swagger: {
      enabled: parseBoolean(
        process.env.SWAGGER_ENABLED,
        environment !== 'production',
      ),
    },

    security: {
      rateLimit: {
        ttlMs: parseInteger(process.env.RATE_LIMIT_TTL_MS, 60_000),
        max: parseInteger(process.env.RATE_LIMIT_MAX, 120),
      },
    },

    jwt: {
      secret: process.env.JWT_SECRET,
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      refreshSecret: process.env.JWT_REFRESH_SECRET,
    },

    session: {
      expiresDays: parseInteger(process.env.SESSION_EXPIRES_DAYS, 7),
    },

    database: {
      url: process.env.DATABASE_URL,
    },

    stripe: {
      secretKey: process.env.STRIPE_SECRET_KEY,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    },
  };
};
