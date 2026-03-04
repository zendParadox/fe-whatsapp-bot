import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseSmartAmount } from "@/lib/whatsapp/parser";
import { startOfMonth, endOfMonth } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import type { CommandContext } from "../lib/context";

const TIMEZONE = "Asia/Jakarta";

export async function handleBudget(ctx: CommandContext): Promise<NextResponse | null> {
  // Set budget
  if (ctx.command === "budget" || ctx.command === "anggaran") {
    return handleSetBudget(ctx);
  }

  // Cek budget
  if (ctx.command === "cek" && (ctx.args[1] === "budget" || ctx.args[1] === "anggaran")) {
    return handleCheckBudget(ctx);
  }

  return null;
}

async function handleSetBudget(ctx: CommandContext): Promise<NextResponse> {
  const amount = parseSmartAmount(ctx.args[1]);
  const categoryNameMatch = ctx.message.match(/@(\w+)/);
  const categoryName = categoryNameMatch ? categoryNameMatch[1] : null;

  if (!amount || !categoryName) {
    return NextResponse.json({
      message: "❌ *Format Budget Salah*\n\n📌 *Format yang benar:*\n\`budget 1jt @makan\`\n\n📝 *Penjelasan:*\n• \`budget\` = Perintah set budget\n• \`1jt\` = Jumlah budget\n• \`@makan\` = Nama kategori\n\n💡 *Contoh lain:*\n\`budget 500k @transportasi\`\n\`budget 2jt @belanja\`",
    });
  }

  let category = await prisma.category.findFirst({
    where: { user_id: ctx.user.id, name: { equals: categoryName, mode: "insensitive" } },
  });

  if (!category) {
    category = await prisma.category.create({ data: { name: categoryName, user_id: ctx.user.id } });
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

  const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const monthName = monthNames[currentMonth - 1];

  return NextResponse.json({
    message: `🎯 *Budget Berhasil Diatur!*\n━━━━━━━━━━━━━━━━━\n📂 *Kategori:* ${category.name}\n💰 *Anggaran:* ${ctx.fmt(amount)}\n📅 *Periode:* ${monthName} ${currentYear}\n━━━━━━━━━━━━━━━━━\n\n💡 _Ketik \"cek budget\" untuk lihat status_`,
  });
}

async function handleCheckBudget(ctx: CommandContext): Promise<NextResponse> {
  const nowWIB = toZonedTime(new Date(), TIMEZONE);
  const currentMonth = nowWIB.getMonth() + 1;
  const currentYear = nowWIB.getFullYear();
  const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

  const budgets = await prisma.budget.findMany({
    where: { user_id: ctx.user.id, month: currentMonth, year: currentYear },
    include: { category: true }
  });

  if (budgets.length === 0) {
    return NextResponse.json({
      message: `⚠️ *Belum Ada Budget*\n\nAnda belum mengatur budget untuk bulan ${monthNames[currentMonth - 1]}.\n\n💡 *Cara set budget:*\n\`budget 1jt @makan\`\n\`budget 500k @transportasi\``
    });
  }

  let reply = `🎯 *Status Budget ${monthNames[currentMonth - 1]}*\n━━━━━━━━━━━━━━━━━\n`;

  for (const b of budgets) {
    const aggregations = await prisma.transaction.aggregate({
      where: {
        user_id: ctx.user.id,
        category_id: b.category_id,
        type: "EXPENSE",
        created_at: { gte: startOfMonth(nowWIB), lte: endOfMonth(nowWIB) }
      },
      _sum: { amount: true }
    });

    const used = aggregations._sum.amount?.toNumber() || 0;
    const total = b.amount.toNumber();
    const remaining = total - used;
    const percent = Math.round((used / total) * 100);

    let statusIcon, statusBar;
    if (percent > 100) {
      statusIcon = "🔴";
      statusBar = "▓▓▓▓▓▓▓▓▓▓ OVER!";
    } else if (percent > 80) {
      statusIcon = "🟡";
      const filled = Math.round(percent / 10);
      statusBar = "▓".repeat(filled) + "░".repeat(10 - filled);
    } else {
      statusIcon = "🟢";
      const filled = Math.round(percent / 10);
      statusBar = "▓".repeat(filled) + "░".repeat(10 - filled);
    }

    reply += `\n${statusIcon} *${b.category.name}*\n`;
    reply += `   ${statusBar} ${percent}%\n`;
    reply += `   💸 Terpakai: ${ctx.fmt(used)}\n`;
    reply += `   💰 Sisa: ${ctx.fmt(remaining)}\n`;
  }

  reply += `\n💡 _Ketik "laporan bulan" untuk detail lengkap_`;
  return NextResponse.json({ message: reply });
}
