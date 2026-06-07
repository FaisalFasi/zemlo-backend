// ============================================
// IMPORT SECTION
// ============================================
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

export const prismaPGAdapter = (database_url: string) => {
  // ============================================
  // CREATE DATABASE CONNECTION
  // ============================================
  if (!database_url) {
    throw new Error('❌ DATABASE_URL missing in .env');
  }

  console.log('🔌 Connecting to NeonDB via PG Adapter...');

  // Create a standard Postgres connection pool
  const pool = new Pool({
    connectionString: database_url,
    // Neon ke liye SSL zaroori hai
    ssl: { rejectUnauthorized: false }, // Neon ke liye safer
  });

  // Adapter banayo
  return new PrismaPg(pool);
};
