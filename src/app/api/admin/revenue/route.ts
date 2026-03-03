import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdmin } from "@/lib/admin";
import { subMonths, startOfMonth, endOfMonth, format } from "date-fns";

export async function GET() {
  const auth = await verifyAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [
      activeSubscriptions,
      totalRevenue,
      expiringSoon,
    ] = await Promise.all([
      prisma.user.count({
        where: { plan_type: "PREMIUM", premium_valid_until: { gte: now } },
      }),
      prisma.subscription.aggregate({
        where: { status: "PAID" },
        _sum: { amount: true },
      }),
      prisma.user.count({
        where: {
          plan_type: "PREMIUM",
          premium_valid_until: { gte: now, lte: weekFromNow },
        },
      }),
    ]);

    // Monthly revenue trend (last 6 months)
    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const start = startOfMonth(monthDate);
      const end = endOfMonth(monthDate);

      const monthRevenue = await prisma.subscription.aggregate({
        where: {
          status: "PAID",
          created_at: { gte: start, lte: end },
        },
        _sum: { amount: true },
        _count: true,
      });

      monthlyTrend.push({
        month: format(monthDate, "MMM yyyy"),
        revenue: Number(monthRevenue._sum?.amount ?? 0),
        count: monthRevenue._count,
      });
    }

    return NextResponse.json({
      activeSubscriptions,
      totalRevenue: Number(totalRevenue._sum?.amount ?? 0),
      expiringSoon,
      monthlyTrend,
    });
  } catch (error) {
    console.error("Admin revenue error:", error);
    return NextResponse.json({ error: "Failed to fetch revenue" }, { status: 500 });
  }
}
