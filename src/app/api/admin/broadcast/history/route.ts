import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdmin } from "@/lib/admin";

export async function GET(request: NextRequest) {
  const auth = await verifyAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = 20;
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      prisma.broadcastLog.findMany({
        orderBy: { created_at: "desc" },
        skip,
        take: limit,
      }),
      prisma.broadcastLog.count(),
    ]);

    return NextResponse.json({
      logs,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Broadcast history error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
