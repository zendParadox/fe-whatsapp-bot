import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";
import {
  getPerformanceSummary,
  getPerformanceLogs,
  clearPerformanceLogs,
} from "@/lib/performance";

/**
 * GET /api/performance — Get performance metrics summary
 * Query params:
 *   ?detail=true — Include raw log entries
 */
export async function GET(request: Request) {
  try {
    // Auth check — only logged-in users can access
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload?.userId)
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const includeDetail = searchParams.get("detail") === "true";

    const summary = getPerformanceSummary();

    const response: Record<string, unknown> = {
      summary,
      generatedAt: new Date().toISOString(),
    };

    if (includeDetail) {
      const logs = getPerformanceLogs();
      // Return last 100 logs (most recent first)
      response.recentLogs = logs.slice(-100).reverse();
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("GET /api/performance error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/performance — Clear in-memory performance logs
 */
export async function DELETE() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload?.userId)
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    clearPerformanceLogs();

    return NextResponse.json({ message: "Performance logs cleared" });
  } catch (error) {
    console.error("DELETE /api/performance error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
