import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

// On Windows local dev without a real DB URL, fall back to local SQLite
if (process.platform === "win32" && !process.env.DATABASE_URL?.startsWith("postgres")) {
  process.env.DATABASE_URL = "file:C:/Users/vince/bbc.db";
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ log: ["error"] });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
