import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseSmartAmount } from "@/lib/whatsapp/parser";
import { startOfMonth, endOfMonth } from "date-fns";
import { formatInTimeZone, toZonedTime, fromZonedTime } from "date-fns-tz";
import { id } from "date-fns/locale";
import type { CommandContext } from "../lib/context";

const TIMEZONE = "Asia/Jakarta";

export async function handleBudget(
  ctx: CommandContext,
): Promise<NextResponse | null> {
  const cmd = ctx.command.toLowerCase();
  const arg1 = ctx.args[1]?.toLowerCase();

  // Set budget
  if (["budget", "anggaran"].includes(cmd)) return handleSetBudget(ctx);

  // Cek budget
  if (cmd === "cek" && ["budget", "anggaran"].includes(arg1))
    return handleCheckBudget(ctx);

  return null;
}

async function handleSetBudget(ctx: CommandContext): Promise<NextResponse> {
  const amount = parseSmartAmount(ctx.args[1]);

  // Regex diperbaiki untuk mendukung nama kategori dengan titik/strip
  const categoryNameMatch = ctx.message.match(/@([a-zA-Z0-9_.-]+)/);
  const categoryName = categoryNameMatch ? categoryNameMatch[1] : null;

  if (!amount || !categoryName) {
    return NextResponse.json({
      message:
        "❌ *Format Budget Salah*\n\n📌 *Format yang benar:*\n`budget 1jt @makan`\n\n📝 *Penjelasan:*\n• `budget` = Perintah set budget\n• `1jt` = Jumlah budget\n• `@makan` = Nama kategori\n\n💡 *Contoh lain:*\n`budget 500k @transportasi`\n`budget 2jt @belanja`",
    });
  }

  try {
    let category = await prisma.category.findFirst({
      where: {
        user_id: ctx.user.id,
        name: { equals: categoryName, mode: "insensitive" },
      },
    });

    if (!category) {
      category = await prisma.category.create({
        data: { name: categoryName, user_id: ctx.user.id },
      });
    }

    const nowWIB = toZonedTime(new Date(), TIMEZONE);
    const currentMonth = nowWIB.getMonth() + 1;
    const currentYear = nowWIB.getFullYear();

    await prisma.budget.upsert({
      where: {
        user_id_category_id_month_year: {
          user_id: ctx.user.id,
          category_id: category.id,
          month: currentMonth,
          year: currentYear,
        },
      },
      update: { amount },
      create: {
        user_id: ctx.user.id,
        category_id: category.id,
        amount,
        month: currentMonth,
        year: currentYear,
      },
    });

    // Menggunakan date-fns untuk mendapatkan nama bulan secara dinamis
    const monthName = formatInTimeZone(nowWIB, TIMEZONE, "MMMM", {
      locale: id,
    });

    return NextResponse.json({
      message: `🎯 *Budget Berhasil Diatur!*\n━━━━━━━━━━━━━━━━━\n📂 *Kategori:* ${category.name}\n💰 *Anggaran:* ${ctx.fmt(amount)}\n📅 *Periode:* ${monthName} ${currentYear}\n━━━━━━━━━━━━━━━━━\n\n💡 _Ketik "cek budget" untuk lihat status_`,
    });
  } catch (error) {
    console.error("[Set Budget Error]:", error);
    return NextResponse.json({
      message: "❌ Gagal mengatur budget karena kesalahan sistem.",
    });
  }
}

async function handleCheckBudget(ctx: CommandContext): Promise<NextResponse> {
  try {
    const nowWIB = toZonedTime(new Date(), TIMEZONE);
    const currentMonth = nowWIB.getMonth() + 1;
    const currentYear = nowWIB.getFullYear();
    const monthName = formatInTimeZone(nowWIB, TIMEZONE, "MMMM", {
      locale: id,
    });

    const budgets = await prisma.budget.findMany({
      where: { user_id: ctx.user.id, month: currentMonth, year: currentYear },
      include: { category: true },
    });

    if (budgets.length === 0) {
      return NextResponse.json({
        message: `⚠️ *Belum Ada Budget*\n\nAnda belum mengatur budget untuk bulan ${monthName}.\n\n💡 *Cara set budget:*\n\`budget 1jt @makan\`\n\`budget 500k @transportasi\``,
      });
    }

    // ── FIX BUG ZONA WAKTU: Konversi batas bulan WIB ke UTC Database ──
    const startUTC = fromZonedTime(startOfMonth(nowWIB), TIMEZONE);
    const endUTC = fromZonedTime(endOfMonth(nowWIB), TIMEZONE);

    // TypeScript otomatis membaca ini sebagai Array of Strings (tanpa perlu tipe 'any')
    const categoryIds = budgets.map((b) => b.category_id);

    const expenseAggregations = await prisma.transaction.groupBy({
      by: ["category_id"],
      where: {
        user_id: ctx.user.id,
        category_id: { in: categoryIds },
        type: "EXPENSE",
        created_at: { gte: startUTC, lte: endUTC },
      },
      _sum: { amount: true },
    });

    const expenseMap = new Map<string, number>();
    for (const agg of expenseAggregations) {
      if (agg.category_id) {
        expenseMap.set(agg.category_id, agg._sum.amount?.toNumber() || 0);
      }
    }

    let reply = `🎯 *Status Budget ${monthName}*\n━━━━━━━━━━━━━━━━━\n`;

    for (const b of budgets) {
      const used = expenseMap.get(b.category_id) || 0;
      const total = b.amount.toNumber();
      const remaining = total - used;
      const percent = Math.round((used / total) * 100);

      let statusIcon, statusBar;
      if (percent > 100) {
        statusIcon = "🔴";
        statusBar = "▓▓▓▓▓▓▓▓▓▓ OVER!";
      } else {
        statusIcon = percent > 80 ? "🟡" : "🟢";
        const filled = Math.round(percent / 10);
        // Memastikan parameter repeat tidak negatif atau NaN (sangat langka tapi aman)
        const safeFilled = Math.max(0, Math.min(10, filled));
        statusBar = "▓".repeat(safeFilled) + "░".repeat(10 - safeFilled);
      }

      reply += `\n${statusIcon} *${b.category.name}*\n   ${statusBar} ${percent}%\n   💸 Terpakai: ${ctx.fmt(used)}\n   💰 Sisa: ${ctx.fmt(remaining)}\n`;
    }

    reply += `\n💡 _Ketik "laporan bulan" untuk detail lengkap_`;
    return NextResponse.json({ message: reply });
  } catch (error) {
    console.error("[Check Budget Error]:", error);
    return NextResponse.json({
      message: "❌ Gagal memuat data budget. Sistem sedang sibuk.",
    });
  }
}
