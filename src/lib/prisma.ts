import { PrismaClient } from "@prisma/client";

declare global {
  // allow global var across module reloads in development

  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ??
  new PrismaClient({
    log: ["info", "warn", "error"],
  });

if (process.env.NODE_ENV !== "production") global.prisma = prisma;
