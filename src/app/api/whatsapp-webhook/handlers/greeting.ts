import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import type { CommandContext } from "../lib/context";

const TIMEZONE = "Asia/Jakarta";

const GREETING_TRIGGERS = [
  "halo gotek bot!", "halo gotek bot", "hi", "halo", "hai", "p", "ping", "test"
];

export async function handleGreeting(ctx: CommandContext): Promise<NextResponse | null> {
  if (!GREETING_TRIGGERS.includes(ctx.trimmedMessage)) return null;

  const nowWIB = toZonedTime(new Date(), TIMEZONE);
  const hour = nowWIB.getHours();
  const greeting = hour < 11 ? "Selamat pagi" : hour < 15 ? "Selamat siang" : hour < 18 ? "Selamat sore" : "Selamat malam";

  const startDayWIB = startOfDay(nowWIB);
  const endDayWIB = endOfDay(nowWIB);

  const todayTxs = await prisma.transaction.findMany({
    where: { user_id: ctx.user.id, created_at: { gte: startDayWIB, lte: endDayWIB } }
  });

  const todayIncome = todayTxs.filter(t => t.type === "INCOME").reduce((acc, t) => acc + t.amount.toNumber(), 0);
  const todayExpense = todayTxs.filter(t => t.type === "EXPENSE").reduce((acc, t) => acc + t.amount.toNumber(), 0);

  return NextResponse.json({
    message: `👋 *${greeting}, ${ctx.user.name || "Sobat GoTEK"}!*\n\n🤖 Saya *GoTEK Bot* - asisten pencatat keuangan Anda!\n\n📊 *Quick Stats Hari Ini:*\n📈 Pemasukan: ${ctx.fmt(todayIncome)}\n📉 Pengeluaran: ${ctx.fmt(todayExpense)}\n\n💡 *Tips:* Ketik *"panduan"* untuk melihat fitur lengkap atau langsung coba catat secara bebas, contoh:\n\`keluar 50k beli kopi ya\`\n\n🚀 Let's go!`
  });
}
