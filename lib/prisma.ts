// lib/prisma.ts
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const globalForPrisma = globalThis as unknown as {
  __prisma?: PrismaClient;
};

if (!globalForPrisma.__prisma) {
  // sanitize DATABASE_URL (remove surrounding single/double quotes if present)
  const rawUrl = process.env.DATABASE_URL || '';
  const connectionString = rawUrl.replace(/^['"]|['"]$/g, '');

  // Use a pg.Pool instead of a single Client. Pools handle TLS and connection
  const pool = new pg.Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false,
    },
    // sensible defaults
    max: Number(process.env.PG_POOL_MAX || 10),
    idleTimeoutMillis: 30000,
  });

  globalForPrisma.__prisma = new PrismaClient({
    adapter: new PrismaPg(pool),
    log: ['query', 'info', 'warn', 'error'],
  });
}

export const prisma = globalForPrisma.__prisma;
