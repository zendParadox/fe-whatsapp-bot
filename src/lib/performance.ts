import { NextResponse } from "next/server";

/**
 * Performance tracking utility for Next.js API routes.
 *
 * Usage:
 *   export const GET = withPerformanceTracking(handler, "/api/wallets");
 */

type NextHandler = (
  request: Request,
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  context?: any
) => Promise<NextResponse | Response>;

interface PerformanceLog {
  endpoint: string;
  method: string;
  statusCode: number;
  durationMs: number;
  timestamp: Date;
}

// In-memory buffer for recent logs (last 500 entries)
const MAX_LOG_SIZE = 500;
const performanceLogs: PerformanceLog[] = [];

/**
 * Add a log entry to the in-memory buffer
 */
function addLog(log: PerformanceLog) {
  performanceLogs.push(log);
  if (performanceLogs.length > MAX_LOG_SIZE) {
    performanceLogs.shift(); // Remove oldest
  }
}

/**
 * Get all in-memory performance logs
 */
export function getPerformanceLogs(): PerformanceLog[] {
  return [...performanceLogs];
}

/**
 * Get performance summary statistics
 */
export function getPerformanceSummary() {
  if (performanceLogs.length === 0) {
    return { endpoints: [], totalRequests: 0, avgDurationMs: 0 };
  }

  // Group by endpoint
  const endpointMap: Record<
    string,
    { totalMs: number; count: number; maxMs: number; minMs: number; statusCodes: Record<number, number> }
  > = {};

  for (const log of performanceLogs) {
    const key = `${log.method} ${log.endpoint}`;
    if (!endpointMap[key]) {
      endpointMap[key] = { totalMs: 0, count: 0, maxMs: 0, minMs: Infinity, statusCodes: {} };
    }
    const entry = endpointMap[key];
    entry.totalMs += log.durationMs;
    entry.count++;
    entry.maxMs = Math.max(entry.maxMs, log.durationMs);
    entry.minMs = Math.min(entry.minMs, log.durationMs);
    entry.statusCodes[log.statusCode] = (entry.statusCodes[log.statusCode] || 0) + 1;
  }

  // Calculate P95 per endpoint
  const endpointDetails = Object.entries(endpointMap).map(([key, data]) => {
    const [method, ...endpointParts] = key.split(" ");
    const endpoint = endpointParts.join(" ");

    // Get sorted durations for this endpoint
    const durations = performanceLogs
      .filter((l) => `${l.method} ${l.endpoint}` === key)
      .map((l) => l.durationMs)
      .sort((a, b) => a - b);

    const p95Index = Math.floor(durations.length * 0.95);
    const p95 = durations[p95Index] || durations[durations.length - 1];

    return {
      endpoint,
      method,
      avgMs: Math.round(data.totalMs / data.count),
      maxMs: data.maxMs,
      minMs: data.minMs === Infinity ? 0 : data.minMs,
      p95Ms: p95,
      count: data.count,
      statusCodes: data.statusCodes,
    };
  });

  // Sort by average response time (slowest first)
  endpointDetails.sort((a, b) => b.avgMs - a.avgMs);

  const totalMs = performanceLogs.reduce((sum, l) => sum + l.durationMs, 0);

  return {
    endpoints: endpointDetails,
    totalRequests: performanceLogs.length,
    avgDurationMs: Math.round(totalMs / performanceLogs.length),
  };
}

/**
 * Clear all in-memory performance logs
 */
export function clearPerformanceLogs() {
  performanceLogs.length = 0;
}

/**
 * Higher-Order Function that wraps an API route handler with performance tracking.
 *
 * Logs:
 *   ⚡ [PERF] GET /api/wallets — 123ms (200)
 *
 * Warns for slow responses (>500ms):
 *   🐌 [SLOW API] GET /api/dashboard — 1234ms (200)
 */
export function withPerformanceTracking(
  handler: NextHandler,
  endpoint: string
): NextHandler {
  const SLOW_API_THRESHOLD_MS = 500;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return async (request: Request, context?: any) => {
    const start = performance.now();
    const method = request.method;

    try {
      const response = await handler(request, context);
      const durationMs = Math.round(performance.now() - start);
      const statusCode = response.status;

      // Log to console
      if (durationMs >= SLOW_API_THRESHOLD_MS) {
        console.warn(
          `🐌 [SLOW API] ${method} ${endpoint} — ${durationMs}ms (${statusCode})`
        );
      } else {
        console.log(
          `⚡ [PERF] ${method} ${endpoint} — ${durationMs}ms (${statusCode})`
        );
      }

      // Store in memory
      addLog({
        endpoint,
        method,
        statusCode,
        durationMs,
        timestamp: new Date(),
      });

      // Add performance headers to response
      const newHeaders = new Headers(response.headers);
      newHeaders.set("X-Response-Time", `${durationMs}ms`);
      newHeaders.set("Server-Timing", `total;dur=${durationMs}`);

      return new NextResponse(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders,
      });
    } catch (error) {
      const durationMs = Math.round(performance.now() - start);
      console.error(
        `💥 [ERROR] ${method} ${endpoint} — ${durationMs}ms — ${error}`
      );

      addLog({
        endpoint,
        method,
        statusCode: 500,
        durationMs,
        timestamp: new Date(),
      });

      throw error;
    }
  };
}
