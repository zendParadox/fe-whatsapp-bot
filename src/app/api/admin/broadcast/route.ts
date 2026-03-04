import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdmin } from "@/lib/admin";
import { subDays } from "date-fns";

const GOLANG_BOT_URL = process.env.GOLANG_BOT_URL || "https://bot.rafliramadhani.site";

type FilterType = "1d" | "7d" | "30d" | "all" | "premium" | "free";

async function getUserPhonesByFilter(filter: FilterType): Promise<string[]> {
  const now = new Date();

  switch (filter) {
    case "1d":
    case "7d":
    case "30d": {
      const days = filter === "1d" ? 1 : filter === "7d" ? 7 : 30;
      const since = subDays(now, days);
      // Get unique user_ids with transactions in the period
      const activeUserIds = await prisma.transaction.groupBy({
        by: ["user_id"],
        where: { created_at: { gte: since } },
      });
      if (activeUserIds.length === 0) return [];
      const users = await prisma.user.findMany({
        where: {
          id: { in: activeUserIds.map((u) => u.user_id) },
          whatsapp_jid: { not: null },
        },
        select: { whatsapp_jid: true },
      });
      return users.map((u) => u.whatsapp_jid!).filter(Boolean);
    }
    case "premium":
      const premiumUsers = await prisma.user.findMany({
        where: { plan_type: "PREMIUM", whatsapp_jid: { not: null } },
        select: { whatsapp_jid: true },
      });
      return premiumUsers.map((u) => u.whatsapp_jid!).filter(Boolean);
    case "free":
      const freeUsers = await prisma.user.findMany({
        where: { plan_type: "FREE", whatsapp_jid: { not: null } },
        select: { whatsapp_jid: true },
      });
      return freeUsers.map((u) => u.whatsapp_jid!).filter(Boolean);
    case "all":
    default:
      const allUsers = await prisma.user.findMany({
        where: { whatsapp_jid: { not: null } },
        select: { whatsapp_jid: true },
      });
      return allUsers.map((u) => u.whatsapp_jid!).filter(Boolean);
  }
}

export async function POST(request: NextRequest) {
  const auth = await verifyAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const { message, filter = "all" } = body as { message: string; filter: FilterType };

    if (!message?.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Get target phone numbers
    const phones = await getUserPhonesByFilter(filter);
    if (phones.length === 0) {
      return NextResponse.json({ error: "Tidak ada user untuk filter ini" }, { status: 400 });
    }

    // Bypass TLS leaf signature verification temp
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

    // Send to Go bot /broadcast endpoint
    const baseUrl = GOLANG_BOT_URL.endsWith("/") ? GOLANG_BOT_URL.slice(0, -1) : GOLANG_BOT_URL;
    const botResponse = await fetch(`${baseUrl}/broadcast`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phones,
        message: message.trim(),
        delay_seconds: 75,
      }),
    });

    // Re-enable it if not in dev
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "1";

    if (!botResponse.ok) {
      const errText = await botResponse.text();
      console.error("Broadcast bot error:", errText);
      return NextResponse.json({ error: "Failed to send broadcast to bot" }, { status: 500 });
    }

    // Save broadcast log
    await prisma.broadcastLog.create({
      data: {
        message: message.trim(),
        filter,
        total_sent: phones.length,
        total_failed: 0,
      },
    });

    return NextResponse.json({
      success: true,
      totalRecipients: phones.length,
      filter,
      status: "processing",
    });
  } catch (error) {
    console.error("Broadcast error:", error);
    return NextResponse.json({ error: "Failed to send broadcast" }, { status: 500 });
  }
}
