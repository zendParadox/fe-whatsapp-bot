/* eslint-disable */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdmin } from "@/lib/admin";
import { subDays } from "date-fns";

export async function GET() {
  const auth = await verifyAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = subDays(now, 7);
    const monthAgo = subDays(now, 30);

    const [
      totalUsers,
      premiumUsers,
      freeUsers,
      totalTransactions,
      usersToday,
      usersThisWeek,
      usersThisMonth,
      activeUsers7d,
      totalFeedback,
      recentUsers,
      recentFeedback,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { plan_type: "PREMIUM" } }),
      prisma.user.count({ where: { plan_type: "FREE" } }),
      prisma.transaction.count(),
      prisma.user.count({ where: { created_at: { gte: today } } }),
      prisma.user.count({ where: { created_at: { gte: weekAgo } } }),
      prisma.user.count({ where: { created_at: { gte: monthAgo } } }),
      // Active users = users with transactions in last 7 days
      prisma.transaction.groupBy({
        by: ["user_id"],
        where: { created_at: { gte: weekAgo } },
      }).then((r) => r.length),
      prisma.feedback.count(),
      // Recent 10 users
      prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          whatsapp_jid: true,
          plan_type: true,
          created_at: true,
          _count: { select: { transactions: true } },
        },
        orderBy: { created_at: "desc" },
        take: 10,
      }),
      // Recent 10 feedback
      prisma.feedback.findMany({
        include: { user: { select: { name: true, whatsapp_jid: true } } },
        orderBy: { created_at: "desc" },
        take: 10,
      }),
    ]);

    return NextResponse.json({
      overview: {
        totalUsers,
        premiumUsers,
        freeUsers,
        totalTransactions,
        totalFeedback,
        activeUsers7d,
      },
      registrations: {
        today: usersToday,
        thisWeek: usersThisWeek,
        thisMonth: usersThisMonth,
      },
      recentUsers,
      recentFeedback,
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
