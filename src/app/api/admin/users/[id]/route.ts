/* eslint-disable */
import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdmin } from "@/lib/admin";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        whatsapp_jid: true,
        avatar_url: true,
        plan_type: true,
        premium_valid_until: true,
        currency: true,
        created_at: true,
        _count: {
          select: { transactions: true, debts: true, budgets: true, feedbacks: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Recent transactions
    const recentTransactions = await prisma.transaction.findMany({
      where: { user_id: id },
      include: { category: { select: { name: true } } },
      orderBy: { created_at: "desc" },
      take: 20,
    });

    // Subscriptions
    const subscriptions = await prisma.subscription.findMany({
      where: { user_id: id },
      orderBy: { created_at: "desc" },
      take: 10,
    });

    return NextResponse.json({ user, recentTransactions, subscriptions });
  } catch (error) {
    console.error("Admin user detail error:", error);
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}
