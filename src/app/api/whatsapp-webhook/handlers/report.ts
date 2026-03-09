import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from "date-fns";
import { formatInTimeZone, toZonedTime } from "date-fns-tz";
import { id } from "date-fns/locale";
import type { CommandContext } from "../lib/context";

const TIMEZONE = "Asia/Jakarta";

export async function handleReport(ctx: CommandContext): Promise<NextResponse | null> {
  // Laporan command
  if (ctx.command === "laporan" || ctx.command === "report") {
    const type = ctx.args[1]?.toLowerCase();

    if (type === "hari" || type === "today" || type === "harian") {
      return handleDailyReport(ctx);
    } else if (type === "bulan" || type === "month" || type === "bulanan") {
      return handleMonthlyReport(ctx);
    } else if (type === "minggu" || type === "week" || type === "mingguan") {
      return handleWeeklyReport(ctx);
    }
  }

  // Cek saldo
  if (ctx.command === "saldo" || ctx.command === "ceksaldo" || (ctx.command === "cek" && ctx.args[1] === "saldo")) {
    return handleSaldo(ctx);
  }

  return null;
}

async function handleDailyReport(ctx: CommandContext): Promise<NextResponse> {
  const now = new Date();
  const nowWIB = toZonedTime(now, TIMEZONE);
  const startDayWIB = startOfDay(nowWIB);
  const endDayWIB = endOfDay(nowWIB);

  // Convert WIB boundaries back to UTC for DB query
  const startUTC = new Date(startDayWIB.getTime() - 7 * 60 * 60 * 1000);
  const endUTC = new Date(endDayWIB.getTime() - 7 * 60 * 60 * 1000);

  const transactions = await prisma.transaction.findMany({
    where: { user_id: ctx.user.id, created_at: { gte: startUTC, lte: endUTC } },
    include: { category: true }
  });

  const income = transactions.filter(t => t.type === "INCOME").reduce((acc, t) => acc + t.amount.toNumber(), 0);
  const expense = transactions.filter(t => t.type === "EXPENSE").reduce((acc, t) => acc + t.amount.toNumber(), 0);
  const balance = income - expense;
  const balanceEmoji = balance >= 0 ? "💚" : "💔";
  const txCount = transactions.length;
  const dateStr = formatInTimeZone(now, TIMEZONE, "eeee, d MMMM yyyy", { locale: id });

  let reply = `📊 *Laporan Hari Ini*\n📅 ${dateStr}\n━━━━━━━━━━━━━━━━━\n`;
  reply += `📈 *Pemasukan:* ${ctx.fmt(income)}\n`;
  reply += `📉 *Pengeluaran:* ${ctx.fmt(expense)}\n`;
  reply += `━━━━━━━━━━━━━━━━━\n`;
  reply += `${balanceEmoji} *Balance:* ${ctx.fmt(balance)}\n`;
  reply += `📝 *Total Transaksi:* ${txCount} transaksi\n`;

  if (txCount > 0) {
    reply += `\n📋 *Detail Terakhir:*\n`;
    const lastTx = transactions.slice(-3).reverse();
    lastTx.forEach(t => {
      const icon = t.type === "INCOME" ? "➕" : "➖";
      reply += `${icon} ${ctx.fmt(t.amount.toNumber())} - ${t.description}\n`;
    });
  }

  return NextResponse.json({ message: reply });
}

async function handleMonthlyReport(ctx: CommandContext): Promise<NextResponse> {
  const now = new Date();
  const nowWIB = toZonedTime(now, TIMEZONE);
  const startMonthWIB = startOfMonth(nowWIB);
  const endMonthWIB = endOfMonth(nowWIB);
  const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const monthName = monthNames[nowWIB.getMonth()];

  // Convert WIB boundaries back to UTC for DB query
  const startUTC = new Date(startMonthWIB.getTime() - 7 * 60 * 60 * 1000);
  const endUTC = new Date(endMonthWIB.getTime() - 7 * 60 * 60 * 1000);

  const transactions = await prisma.transaction.findMany({
    where: { user_id: ctx.user.id, created_at: { gte: startUTC, lte: endUTC } },
    include: { category: true }
  });

  const income = transactions.filter(t => t.type === "INCOME").reduce((acc, t) => acc + t.amount.toNumber(), 0);
  const expense = transactions.filter(t => t.type === "EXPENSE").reduce((acc, t) => acc + t.amount.toNumber(), 0);
  const balance = income - expense;
  const balanceEmoji = balance >= 0 ? "💚" : "💔";
  const savingRate = income > 0 ? Math.round(((income - expense) / income) * 100) : 0;

  let reply = `📊 *Laporan Bulan ${monthName}*\n━━━━━━━━━━━━━━━━━\n`;
  reply += `📈 *Total Pemasukan:*\nRp ${income.toLocaleString("id-ID")}\n\n`;
  reply += `📉 *Total Pengeluaran:*\nRp ${expense.toLocaleString("id-ID")}\n━━━━━━━━━━━━━━━━━\n`;
  reply += `${balanceEmoji} *Balance:* Rp ${balance.toLocaleString("id-ID")}\n`;
  reply += `📊 *Saving Rate:* ${savingRate}%\n\n`;

  reply += buildTopExpenses(transactions);
  return NextResponse.json({ message: reply });
}

async function handleWeeklyReport(ctx: CommandContext): Promise<NextResponse> {
  const now = new Date();
  const nowWIB = toZonedTime(now, TIMEZONE);
  const startWeekWIB = startOfWeek(nowWIB, { weekStartsOn: 1 });
  const endWeekWIB = endOfWeek(nowWIB, { weekStartsOn: 1 });

  const fmtDate = (d: Date) => formatInTimeZone(d, TIMEZONE, "d MMM", { locale: id });

  // Convert WIB boundaries back to UTC for DB query
  const startUTC = new Date(startWeekWIB.getTime() - 7 * 60 * 60 * 1000);
  const endUTC = new Date(endWeekWIB.getTime() - 7 * 60 * 60 * 1000);

  const periodStr = `${fmtDate(startUTC)} - ${fmtDate(endUTC)}`;

  const transactions = await prisma.transaction.findMany({
    where: { user_id: ctx.user.id, created_at: { gte: startUTC, lte: endUTC } },
    include: { category: true }
  });

  const income = transactions.filter(t => t.type === "INCOME").reduce((acc, t) => acc + t.amount.toNumber(), 0);
  const expense = transactions.filter(t => t.type === "EXPENSE").reduce((acc, t) => acc + t.amount.toNumber(), 0);
  const balance = income - expense;
  const balanceEmoji = balance >= 0 ? "💚" : "💔";
  const txCount = transactions.length;

  let reply = `📊 *Laporan Minggu Ini*\n📅 ${periodStr}\n━━━━━━━━━━━━━━━━━\n`;
  reply += `📈 *Total Pemasukan:*\nRp ${income.toLocaleString("id-ID")}\n\n`;
  reply += `📉 *Total Pengeluaran:*\nRp ${expense.toLocaleString("id-ID")}\n━━━━━━━━━━━━━━━━━\n`;
  reply += `${balanceEmoji} *Balance:* Rp ${balance.toLocaleString("id-ID")}\n`;
  reply += `📝 *Total Transaksi:* ${txCount}\n\n`;

  reply += buildTopExpenses(transactions);
  return NextResponse.json({ message: reply });
}

async function handleSaldo(ctx: CommandContext): Promise<NextResponse> {
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
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildTopExpenses(transactions: any[]): string {
  const expensesByCategory = transactions
    .filter(t => t.type === "EXPENSE")
    .reduce((acc, t) => {
      const catName = t.category?.name || "Lainnya";
      acc[catName] = (acc[catName] || 0) + t.amount.toNumber();
      return acc;
    }, {} as Record<string, number>);

  const topExpenses = Object.entries(expensesByCategory)
    .sort((a, b) => (b[1] as number) - (a[1] as number))
    .slice(0, 3);

  if (topExpenses.length === 0) return "";

  let result = `🔥 *Top Pengeluaran:*\n`;
  topExpenses.forEach(([cat, amt], i) => {
    const medals = ['🥇', '🥈', '🥉'];
    result += `${medals[i]} ${cat}: Rp ${(amt as number).toLocaleString("id-ID")}\n`;
  });
  return result;
}
