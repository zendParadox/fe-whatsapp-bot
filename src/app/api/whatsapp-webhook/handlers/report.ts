import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import { formatInTimeZone, toZonedTime, fromZonedTime } from "date-fns-tz";
import { id } from "date-fns/locale";
import type { CommandContext } from "../lib/context";

const TIMEZONE = "Asia/Jakarta";

type TransactionWithCategory = Prisma.TransactionGetPayload<{
  include: { category: true };
}>;

export async function handleReport(
  ctx: CommandContext,
): Promise<NextResponse | null> {
  const cmd = ctx.command.toLowerCase();
  const arg1 = ctx.args[1]?.toLowerCase();

  // 1. Perutean (Routing) yang lebih bersih
  if (["laporan", "report"].includes(cmd)) {
    if (["hari", "today", "harian"].includes(arg1))
      return handleDailyReport(ctx);
    if (["bulan", "month", "bulanan"].includes(arg1))
      return handleMonthlyReport(ctx);
    if (["minggu", "week", "mingguan"].includes(arg1))
      return handleWeeklyReport(ctx);
  }

  if (
    ["saldo", "ceksaldo"].includes(cmd) ||
    (cmd === "cek" && arg1 === "saldo")
  ) {
    return handleSaldo(ctx);
  }

  return null;
}

function getDbBoundaries(startZoned: Date, endZoned: Date) {
  return {
    startUTC: fromZonedTime(startZoned, TIMEZONE),
    endUTC: fromZonedTime(endZoned, TIMEZONE),
  };
}

function calculateStats(
  transactions: { type: string; amount: Prisma.Decimal }[],
) {
  let income = 0;
  let expense = 0;
  for (const t of transactions) {
    const amt = t.amount.toNumber();
    if (t.type === "INCOME") income += amt;
    else if (t.type === "EXPENSE") expense += amt;
  }
  return { income, expense, balance: income - expense };
}

async function handleDailyReport(ctx: CommandContext): Promise<NextResponse> {
  try {
    const nowWIB = toZonedTime(new Date(), TIMEZONE);
    const { startUTC, endUTC } = getDbBoundaries(
      startOfDay(nowWIB),
      endOfDay(nowWIB),
    );

    const transactions = await prisma.transaction.findMany({
      where: {
        user_id: ctx.user.id,
        created_at: { gte: startUTC, lte: endUTC },
      },
      include: { category: true },
    });

    const { income, expense, balance } = calculateStats(transactions);
    const balanceEmoji = balance >= 0 ? "💚" : "💔";
    const dateStr = formatInTimeZone(
      new Date(),
      TIMEZONE,
      "eeee, d MMMM yyyy",
      { locale: id },
    );

    let reply = `📊 *Laporan Hari Ini*\n📅 ${dateStr}\n━━━━━━━━━━━━━━━━━\n`;
    reply += `📈 *Pemasukan:* ${ctx.fmt(income)}\n`;
    reply += `📉 *Pengeluaran:* ${ctx.fmt(expense)}\n━━━━━━━━━━━━━━━━━\n`;
    reply += `${balanceEmoji} *Balance:* ${ctx.fmt(balance)}\n`;
    reply += `📝 *Total Transaksi:* ${transactions.length} transaksi\n`;

    if (transactions.length > 0) {
      reply += `\n📋 *Detail Terakhir:*\n`;
      const lastTx = transactions.slice(-3).reverse();
      lastTx.forEach((t) => {
        const icon = t.type === "INCOME" ? "➕" : "➖";
        reply += `${icon} ${ctx.fmt(t.amount.toNumber())} - ${t.description}\n`;
      });
    }

    return NextResponse.json({ message: reply });
  } catch (error) {
    console.error("[Daily Report Error]:", error);
    return NextResponse.json({ message: "❌ Gagal mengambil laporan harian." });
  }
}

async function handleMonthlyReport(ctx: CommandContext): Promise<NextResponse> {
  try {
    const nowWIB = toZonedTime(new Date(), TIMEZONE);
    const { startUTC, endUTC } = getDbBoundaries(
      startOfMonth(nowWIB),
      endOfMonth(nowWIB),
    );
    const monthName = formatInTimeZone(new Date(), TIMEZONE, "MMMM", {
      locale: id,
    });

    const transactions = await prisma.transaction.findMany({
      where: {
        user_id: ctx.user.id,
        created_at: { gte: startUTC, lte: endUTC },
      },
      include: { category: true },
    });

    const { income, expense, balance } = calculateStats(transactions);
    const balanceEmoji = balance >= 0 ? "💚" : "💔";
    const savingRate =
      income > 0 ? Math.round(((income - expense) / income) * 100) : 0;

    let reply = `📊 *Laporan Bulan ${monthName}*\n━━━━━━━━━━━━━━━━━\n`;
    reply += `📈 *Total Pemasukan:*\n${ctx.fmt(income)}\n\n`;
    reply += `📉 *Total Pengeluaran:*\n${ctx.fmt(expense)}\n━━━━━━━━━━━━━━━━━\n`;
    reply += `${balanceEmoji} *Balance:* ${ctx.fmt(balance)}\n`;
    reply += `📊 *Saving Rate:* ${savingRate}%\n\n`;
    reply += buildTopExpenses(transactions);

    return NextResponse.json({ message: reply });
  } catch (error) {
    console.error("[Monthly Report Error]:", error);
    return NextResponse.json({
      message: "❌ Gagal mengambil laporan bulanan.",
    });
  }
}

async function handleWeeklyReport(ctx: CommandContext): Promise<NextResponse> {
  try {
    const nowWIB = toZonedTime(new Date(), TIMEZONE);
    const { startUTC, endUTC } = getDbBoundaries(
      startOfWeek(nowWIB, { weekStartsOn: 1 }),
      endOfWeek(nowWIB, { weekStartsOn: 1 }),
    );

    const fmtDate = (d: Date) =>
      formatInTimeZone(d, TIMEZONE, "d MMM", { locale: id });
    const periodStr = `${fmtDate(startUTC)} - ${fmtDate(endUTC)}`;

    const transactions = await prisma.transaction.findMany({
      where: {
        user_id: ctx.user.id,
        created_at: { gte: startUTC, lte: endUTC },
      },
      include: { category: true },
    });

    const { income, expense, balance } = calculateStats(transactions);
    const balanceEmoji = balance >= 0 ? "💚" : "💔";

    let reply = `📊 *Laporan Minggu Ini*\n📅 ${periodStr}\n━━━━━━━━━━━━━━━━━\n`;
    reply += `📈 *Total Pemasukan:*\n${ctx.fmt(income)}\n\n`;
    reply += `📉 *Total Pengeluaran:*\n${ctx.fmt(expense)}\n━━━━━━━━━━━━━━━━━\n`;
    reply += `${balanceEmoji} *Balance:* ${ctx.fmt(balance)}\n`;
    reply += `📝 *Total Transaksi:* ${transactions.length}\n\n`;
    reply += buildTopExpenses(transactions);

    return NextResponse.json({ message: reply });
  } catch (error) {
    console.error("[Weekly Report Error]:", error);
    return NextResponse.json({
      message: "❌ Gagal mengambil laporan mingguan.",
    });
  }
}

async function handleSaldo(ctx: CommandContext): Promise<NextResponse> {
  try {
    const transactions = await prisma.transaction.groupBy({
      by: ["type"],
      where: { user_id: ctx.user.id },
      _sum: { amount: true },
    });

    let totalIncome = 0;
    let totalExpense = 0;
    transactions.forEach((t) => {
      const amt = t._sum.amount?.toNumber() || 0;
      if (t.type === "INCOME") totalIncome += amt;
      else if (t.type === "EXPENSE") totalExpense += amt;
    });

    const totalSaldo = totalIncome - totalExpense;
    const balanceEmoji = totalSaldo >= 0 ? "💚" : "💔";

    let reply = `💰 *Total Saldo Saat Ini*\n━━━━━━━━━━━━━━━━━\n`;
    reply += `📈 *Total Pemasukan:*\n${ctx.fmt(totalIncome)}\n\n`;
    reply += `📉 *Total Pengeluaran:*\n${ctx.fmt(totalExpense)}\n━━━━━━━━━━━━━━━━━\n`;
    reply += `${balanceEmoji} *Saldo Akhir (All-time):*\n*${ctx.fmt(totalSaldo)}*\n\n`;
    reply += `💡 _Ketik "laporan bulan" untuk detail bulan ini_`;

    return NextResponse.json({ message: reply });
  } catch (error) {
    console.error("[Saldo Error]:", error);
    return NextResponse.json({ message: "❌ Gagal menghitung total saldo." });
  }
}

function buildTopExpenses(transactions: TransactionWithCategory[]): string {
  const expensesByCategory = new Map<string, number>();

  for (const t of transactions) {
    if (t.type === "EXPENSE") {
      const catName = t.category?.name || "Lainnya";
      expensesByCategory.set(
        catName,
        (expensesByCategory.get(catName) || 0) + t.amount.toNumber(),
      );
    }
  }

  const topExpenses = Array.from(expensesByCategory.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  if (topExpenses.length === 0) return "";

  let result = `🔥 *Top Pengeluaran:*\n`;
  const medals = ["🥇", "🥈", "🥉"];

  topExpenses.forEach(([cat, amt], i) => {
    result += `${medals[i]} ${cat}: Rp ${amt.toLocaleString("id-ID")}\n`;
  });

  return result;
}
