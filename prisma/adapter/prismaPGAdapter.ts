import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

export function prismaPGAdapter(databaseUrl: string): PrismaPg {
  const normalizedDatabaseUrl = databaseUrl.trim();

  if (!normalizedDatabaseUrl) {
    throw new Error('DATABASE_URL is missing');
  }

  const pool = new Pool({
    connectionString: normalizedDatabaseUrl,
  });

  return new PrismaPg(pool);
}
