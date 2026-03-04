import { NextResponse } from "next/server";
import { Decimal } from "@prisma/client/runtime/library";
import { prisma } from "@/lib/prisma";
import { parseTransactionMessage } from "@/lib/whatsapp/parser";
import { checkBudgetStatus } from "@/lib/whatsapp/service";
import { formatInTimeZone } from "date-fns-tz";
import { id } from "date-fns/locale";
import type { CommandContext } from "../lib/context";

const TIMEZONE = "Asia/Jakarta";
const TRANSACTION_COMMANDS = ["masuk", "income", "keluar", "expense", "in", "out"];

export async function handleTransaction(ctx: CommandContext): Promise<NextResponse | null> {
  const lines = ctx.message.split("\n").map(l => l.trim()).filter(l => l.length > 0);
  const transactionLines = lines.filter(line => {
    const firstWord = line.split(" ")[0].toLowerCase();
    return TRANSACTION_COMMANDS.includes(firstWord);
  });

  if (transactionLines.length === 0) return null;

  const results: { success: boolean; icon: string; text: string }[] = [];
  let totalIncome = 0;
  let totalExpense = 0;
  let successCount = 0;
  const budgetAlerts: string[] = [];

  // Pre-fetch user wallets for manual tx wallet detection
  const userWallets = (ctx.user as Record<string, unknown>).plan_type === "PREMIUM"
    ? await prisma.wallet.findMany({ where: { user_id: ctx.user.id } })
    : [];

  for (const line of transactionLines) {
    const parsedData = parseTransactionMessage(line);

    if (!parsedData) {
      results.push({
        success: false,
        icon: "❌",
        text: `"${line.substring(0, 30)}${line.length > 30 ? '...' : ''}" - Format tidak valid`
      });
      continue;
    }

    try {
      let category = await prisma.category.findFirst({
        where: {
          user_id: ctx.user.id,
          name: { equals: parsedData.category, mode: "insensitive" },
        },
      });

      if (!category) {
        category = await prisma.category.create({
          data: { name: parsedData.category, user_id: ctx.user.id },
        });
      }

      if (parsedData.type === "EXPENSE") {
        const alert = await checkBudgetStatus(ctx.user.id, category.id, parsedData.amount, ctx.user.currency);
        if (alert) budgetAlerts.push(`${category.name}: ${alert}`);
        totalExpense += parsedData.amount;
      } else {
        totalIncome += parsedData.amount;
      }

      // Detect wallet from manual transaction line
      let walletId: string | null = null;
      let walletLabel = "";
      const lineLower = line.toLowerCase();
      for (const w of userWallets) {
        const wName = w.name.toLowerCase();
        if (lineLower.includes(wName)) {
          walletId = w.id;
          walletLabel = w.name;
          if (parsedData.type === "EXPENSE") {
            await prisma.wallet.update({ where: { id: w.id }, data: { balance: { decrement: parsedData.amount } } });
          } else {
            await prisma.wallet.update({ where: { id: w.id }, data: { balance: { increment: parsedData.amount } } });
          }
          break;
        }
      }

      await prisma.transaction.create({
        data: {
          type: parsedData.type,
          amount: new Decimal(parsedData.amount),
          description: parsedData.description,
          user_id: ctx.user.id,
          category_id: category.id,
          wallet_id: walletId,
        },
      });

      const icon = parsedData.type === "INCOME" ? "📈" : "📉";
      const formattedAmt = ctx.fmt(parsedData.amount);
      const walletInfo = walletLabel ? ` 💳${walletLabel}` : "";
      results.push({
        success: true,
        icon,
        text: `${formattedAmt} - ${parsedData.description} (${category.name})${walletInfo}`
      });
      successCount++;
    } catch (err) {
      console.error("Transaction error:", err);
      results.push({
        success: false,
        icon: "❌",
        text: `"${parsedData.description}" - Gagal disimpan`
      });
    }
  }

  const dateStr = formatInTimeZone(new Date(), TIMEZONE, "eeee, d MMMM yyyy", { locale: id });

  if (transactionLines.length === 1 && successCount === 1) {
    const r = results[0];
    const parsedData = parseTransactionMessage(transactionLines[0])!;
    const typeText = parsedData.type === "INCOME" ? "Pemasukan" : "Pengeluaran";

    let reply = `${r.icon} *${typeText} Tercatat!*\n`;
    reply += `━━━━━━━━━━━━━━━━━\n`;
    reply += `💰 *Nominal:* ${ctx.fmt(parsedData.amount)}\n`;
    reply += `📂 *Kategori:* ${parsedData.category}\n`;
    reply += `📝 *Keterangan:* ${parsedData.description}\n`;
    reply += ` *Tanggal:* ${dateStr}\n`;
    reply += `━━━━━━━━━━━━━━━━━`;
    if (budgetAlerts.length > 0) {
      reply += `\n\n${budgetAlerts.join('\n')}`;
    }
    reply += `\n\n💡 _Ketik "undo" untuk membatalkan_`;

    return NextResponse.json({ message: reply });
  } else {
    let reply = `📋 *Multi-Transaksi Tercatat!*\n`;
    reply += `📅 ${dateStr}\n`;
    reply += `━━━━━━━━━━━━━━━━━\n\n`;

    results.forEach((r) => {
      reply += `${r.icon} ${r.text}\n`;
    });

    reply += `\n━━━━━━━━━━━━━━━━━\n`;
    reply += `📊 *Ringkasan:*\n`;
    reply += `✅ Berhasil: ${successCount}/${transactionLines.length} transaksi\n`;
    if (totalIncome > 0) reply += `📈 Total Masuk: ${ctx.fmt(totalIncome)}\n`;
    if (totalExpense > 0) reply += `📉 Total Keluar: ${ctx.fmt(totalExpense)}\n`;

    if (budgetAlerts.length > 0) {
      reply += `\n⚠️ *Peringatan Budget:*\n${budgetAlerts.join('\n')}`;
    }

    return NextResponse.json({ message: reply });
  }
}
