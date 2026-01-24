/**
 * Prisma Client Singleton
 *
 * Ensures a single Prisma Client instance across the application
 * Prevents connection pool exhaustion in development (hot reloading)
 *
 * For Trigger.dev workers: Uses DIRECT_DATABASE_URL to bypass the Supabase pooler
 * which can reject connections from isolated worker environments.
 */

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Use direct URL for Trigger.dev workers (bypasses pooler issues)
// Falls back to DATABASE_URL for Next.js app
const databaseUrl = process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: databaseUrl,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
