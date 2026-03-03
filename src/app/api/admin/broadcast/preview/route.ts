/* eslint-disable */
import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdmin } from "@/lib/admin";
import { subDays } from "date-fns";

export async function GET(request: NextRequest) {
  const auth = await verifyAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter") || "all";
    const now = new Date();

    let count = 0;

    switch (filter) {
      case "1d":
      case "7d":
      case "30d": {
        const days = filter === "1d" ? 1 : filter === "7d" ? 7 : 30;
        const since = subDays(now, days);
        const activeUserIds = await prisma.transaction.groupBy({
          by: ["user_id"],
          where: { created_at: { gte: since } },
        });
        const ids = activeUserIds.map((u) => u.user_id);
        count = ids.length > 0
          ? await prisma.user.count({ where: { id: { in: ids }, whatsapp_jid: { not: null } } })
          : 0;
        break;
      }
      case "premium":
        count = await prisma.user.count({ where: { plan_type: "PREMIUM", whatsapp_jid: { not: null } } });
        break;
      case "free":
        count = await prisma.user.count({ where: { plan_type: "FREE", whatsapp_jid: { not: null } } });
        break;
      default:
        count = await prisma.user.count({ where: { whatsapp_jid: { not: null } } });
    }

    return NextResponse.json({ filter, count });
  } catch (error) {
    console.error("Broadcast preview error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
