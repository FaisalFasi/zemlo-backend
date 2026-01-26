// ============================================
// IMPORT SECTION
// ============================================
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

import { config } from 'dotenv';
import { resolve } from 'path';

export const prismaPGAdapter = () => {
  // .env file root folder se load karo
  config({ path: resolve(__dirname, '../.env') });

  // WHY: @prisma/client is auto-generated when you run "npx prisma generate"
  // It contains:
  // - PrismaClient: The database connection object
  // - UserRole: Your enum (CUSTOMER, SELLER, ADMIN)
  // - PermissionCategory: Your enum (PRODUCTS, ORDERS, etc.)

  // ============================================
  // CREATE DATABASE CONNECTION
  // ============================================
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('❌ DATABASE_URL missing in .env');
  }

  console.log('🔌 Connecting to NeonDB via PG Adapter...');

  // Create a standard Postgres connection pool
  const pool = new Pool({
    connectionString,
    // Neon ke liye SSL zaroori hai
    ssl: true,
  });

  // Adapter banayo
  const adapter = new PrismaPg(pool);
  return adapter;
};
