import { PrismaClient } from "@prisma/client";

declare global {
  // allow global var across module reloads in development
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const SLOW_QUERY_THRESHOLD_MS = 200;

function createPrismaClient(): PrismaClient {
  const client = new PrismaClient({
    log: [
      { level: "query", emit: "event" },
      { level: "info", emit: "stdout" },
      { level: "warn", emit: "stdout" },
      { level: "error", emit: "stdout" },
    ],
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (client as any).$on("query", (e: { duration: number; query: string }) => {
    const duration = e.duration;
    if (duration >= SLOW_QUERY_THRESHOLD_MS) {
      console.warn(
        `🐢 [SLOW QUERY] ${duration}ms — ${e.query.substring(0, 200)}`
      );
    }
    // In development, log all queries with timing
    if (process.env.NODE_ENV !== "production" && process.env.PRISMA_QUERY_LOG === "true") {
      console.log(`🔍 [QUERY] ${duration}ms — ${e.query.substring(0, 150)}`);
    }
  });

  return client;
}

export const prisma = global.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") global.prisma = prisma;
