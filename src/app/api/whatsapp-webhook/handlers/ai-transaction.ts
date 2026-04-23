import { NextResponse } from "next/server";
import { TransactionType } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { prisma } from "@/lib/prisma";
import { parseTransactionWithAI } from "@/lib/ai-provider";
import { checkBudgetStatus } from "@/lib/whatsapp/service";
import { formatInTimeZone } from "date-fns-tz";
import { id } from "date-fns/locale";
import type { CommandContext } from "../lib/context";
import { findAccessibleWallets } from "../lib/wallet-utils";

const TIMEZONE = "Asia/Jakarta";

export async function handleAITransaction(ctx: CommandContext): Promise<NextResponse | null> {
  // Only for premium users — free users get the fallback help
  if ((ctx.user as Record<string, unknown>).plan_type === "FREE") return null;

  // Fetch existing categories to pass to AI
  const userCategories = await prisma.category.findMany({
    where: { user_id: ctx.user.id },
    select: { name: true }
  });
  const categoryNames = userCategories.map(c => c.name);

  let aiTransactions;
  try {
    aiTransactions = await parseTransactionWithAI(ctx.message, categoryNames);
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "GEMINI_RATE_LIMIT") {
      return NextResponse.json({
        message: "⚠️ *Limit AI Habis*\n\nMaaf, kuota penggunaan AI (Gemini) telah mencapai batas harian.\n\nSilakan gunakan format manual:\n`keluar [jumlah] [keterangan] [kategori]`\n\nContoh:\n`keluar 50k makan siang @makan`",
      });
    }
    console.error("❌ Error parsing AI transaction:", error);
  }

  if (!aiTransactions || aiTransactions.length === 0) return null;

  const dateStr = formatInTimeZone(new Date(), TIMEZONE, "eeee, d MMMM yyyy", { locale: id });
  let reply = `✨ *Asisten AI GoTEK*\n📅 ${dateStr}\n━━━━━━━━━━━━━━━━━\n`;
  let count = 0;
  const errors: string[] = [];
  const budgetAlertsList: string[] = [];

  // Pre-fetch all user wallets (owned + shared) once
  const userWallets = await findAccessibleWallets(ctx.user.id);

  for (const tx of aiTransactions) {
    try {
      console.log(`📝 Processing transaction: ${tx.description} (${tx.amount})`);

      let category = await prisma.category.findFirst({
        where: { user_id: ctx.user.id, name: { equals: tx.category, mode: "insensitive" } },
      });

      if (!category) {
        category = await prisma.category.create({ data: { name: tx.category, user_id: ctx.user.id } });
        console.log(`✅ Created category: ${tx.category}`);
      }

      if (tx.type === "EXPENSE") {
        const alert = await checkBudgetStatus(ctx.user.id, category.id, tx.amount, ctx.user.currency);
        if (alert) budgetAlertsList.push(`${category.name}: ${alert}`);
      }

      const typeEnum = tx.type === "INCOME" ? TransactionType.INCOME : TransactionType.EXPENSE;

      // Multi-pass wallet detection
      let walletId: string | null = null;
      let walletLabel = "";

      const txDescLower = (tx.description || "").toLowerCase();
      const txCategoryLower = (tx.category || "").toLowerCase();

      // Pass 0: Use AI-extracted wallet name (highest priority, per-transaction)
      if (tx.wallet) {
        const aiWalletName = tx.wallet.toLowerCase();
        for (const w of userWallets) {
          if (w.name.toLowerCase() === aiWalletName) {
            walletId = w.id;
            walletLabel = w.name;
            break;
          }
        }
      }

      // Pass 1: Check AI description and category (fallback)
      if (!walletId) {
        for (const w of userWallets) {
          const wName = w.name.toLowerCase();
          if (txDescLower.includes(wName) || txCategoryLower.includes(wName)) {
            walletId = w.id;
            walletLabel = w.name;
            break;
          }
        }
      }

      // Pass 2: Check raw message (last resort — only if single transaction)
      if (!walletId && aiTransactions.length === 1) {
        for (const w of userWallets) {
          const wName = w.name.toLowerCase();
          if (ctx.lower.includes(wName)) {
            walletId = w.id;
            walletLabel = w.name;
            break;
          }
        }
      }

      // Update wallet balance if matched
      if (walletId) {
        if (tx.type === "EXPENSE") {
          await prisma.wallet.update({ where: { id: walletId }, data: { balance: { decrement: tx.amount } } });
        } else {
          await prisma.wallet.update({ where: { id: walletId }, data: { balance: { increment: tx.amount } } });
        }
      }

      await prisma.transaction.create({
        data: {
          type: typeEnum,
          amount: new Decimal(tx.amount),
          description: tx.description,
          user_id: ctx.user.id,
          category_id: category.id,
          wallet_id: walletId,
        },
      });

      const icon = tx.type === "INCOME" ? "📈" : "📉";
      reply += `\n${icon} *${tx.category}*\n`;
      reply += `   💰 Nominal: ${ctx.fmt(tx.amount)}\n`;
      if (tx.description) reply += `   📝 Ket: ${tx.description}\n`;
      if (walletLabel) reply += `   💳 Kantong: ${walletLabel}\n`;

      count++;
      console.log(`✅ Transaction saved: ${tx.description}`);
    } catch (txError) {
      console.error(`❌ Error processing transaction:`, tx, txError);
      const errorMessage = txError instanceof Error ? txError.message : String(txError);
      errors.push(`${tx.description}: ${errorMessage}`);
    }
  }

  if (count > 0) {
    reply += `\n━━━━━━━━━━━━━━━━━\n`;
    reply += `✅ Berhasil mencatat ${count} transaksi dari AI.`;
    if (budgetAlertsList.length > 0) {
      reply += `\n\n⚠️ *Peringatan Budget:*\n` + budgetAlertsList.map(a => `• ${a}`).join("\n");
    }
    if (errors.length > 0) {
      reply += `\n⚠️ ${errors.length} transaksi gagal diproses.`;
    }
    return NextResponse.json({ message: reply });
  } else if (errors.length > 0) {
    console.error("❌ All AI transactions failed:", errors);
    return NextResponse.json({
      message: `❌ AI Gagal mencatat transaksi:\n${errors.join('\n')}`
    });
  }

  return null;
}
