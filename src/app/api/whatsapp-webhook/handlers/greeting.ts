import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import type { CommandContext } from "../lib/context";

const TIMEZONE = "Asia/Jakarta";

const GREETING_TRIGGERS = new Set([
  "halo gotek bot!",
  "halo gotek bot",
  "hi",
  "halo",
  "hai",
  "p",
  "ping",
  "test",
]);

export async function handleGreeting(
  ctx: CommandContext,
): Promise<NextResponse | null> {
  if (!GREETING_TRIGGERS.has(ctx.trimmedMessage.toLowerCase())) return null;

  try {
    const nowWIB = toZonedTime(new Date(), TIMEZONE);
    const hour = nowWIB.getHours();

    let greeting = "Selamat malam";
    if (hour < 11) greeting = "Selamat pagi";
    else if (hour < 15) greeting = "Selamat siang";
    else if (hour < 18) greeting = "Selamat sore";

    const startDayWIB = startOfDay(nowWIB);
    const endDayWIB = endOfDay(nowWIB);

    const todayStats = await prisma.transaction.groupBy({
      by: ["type"],
      where: {
        user_id: ctx.user.id,
        created_at: { gte: startDayWIB, lte: endDayWIB },
      },
      _sum: { amount: true },
    });

    let todayIncome = 0;
    let todayExpense = 0;

    todayStats.forEach((stat) => {
      const totalAmount = stat._sum.amount?.toNumber() || 0;
      if (stat.type === "INCOME") todayIncome = totalAmount;
      if (stat.type === "EXPENSE") todayExpense = totalAmount;
    });

    const userName = ctx.user.name || "Sobat GoTEK";

    const message = `👋 *${greeting}, ${userName}!*

🤖 Saya *GoTEK Bot* - asisten pencatat keuangan Anda!

📊 *Quick Stats Hari Ini:*
📈 Pemasukan: ${ctx.fmt(todayIncome)}
📉 Pengeluaran: ${ctx.fmt(todayExpense)}

💡 *Tips:* Ketik *"panduan"* untuk melihat fitur lengkap atau langsung coba catat secara bebas, contoh:
\`keluar 50k beli kopi ya\`

🚀 Let's go!`;

    return NextResponse.json({ message });
  } catch (error) {
    console.error("[handleGreeting Error]:", error);
    return NextResponse.json({
      message:
        "🙏 Maaf, saat ini sistem sedang memproses terlalu banyak data. Silakan coba sapa saya lagi sebentar ya!",
    });
  }
}
