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

  // Pre-fetch all user categories
  const userCategories = await prisma.category.findMany({
    where: { user_id: ctx.user.id }
  });
  const categoryMap = new Map<string, string>(); // name (lowercase) -> id
  userCategories.forEach(c => categoryMap.set(c.name.toLowerCase(), c.id));
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

  // Array to hold the Prisma operations for the atomic transaction
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const prismaOperations: any[] = [];
  
  // Track accumulated expenses per category locally to avoid repeatedly checking budget incorrectly
  const accumulatedExpenses = new Map<string, number>();

  for (const tx of aiTransactions) {
    try {
      console.log(`📝 Preparing transaction: ${tx.description} (${tx.amount})`);

      const catNameLower = tx.category.toLowerCase();
      let categoryId = categoryMap.get(catNameLower);

      // Create category if it doesn't exist
      if (!categoryId) {
        const newCategory = await prisma.category.create({ data: { name: tx.category, user_id: ctx.user.id } });
        categoryId = newCategory.id;
        categoryMap.set(catNameLower, categoryId);
        console.log(`✅ Created category: ${tx.category}`);
      }

      if (tx.type === "EXPENSE") {
        const pastExpenses = accumulatedExpenses.get(categoryId) || 0;
        accumulatedExpenses.set(categoryId, pastExpenses + tx.amount);
        
        // We only check budget for the first time we see this category in the loop to avoid N+1 budget alerts
        // Pass the accumulated expenses to budget check
        if (pastExpenses === 0) {
          // Wait, passing tx.amount is safe, but we'll recalculate later if multiple expenses in same category? 
          // Check budget once with total accumulated for the category in this batch
          const totalCategoryExpenseInThisBatch = aiTransactions
            .filter(t => t.type === "EXPENSE" && t.category.toLowerCase() === catNameLower)
            .reduce((sum, t) => sum + t.amount, 0);

          const alert = await checkBudgetStatus(ctx.user.id, categoryId, totalCategoryExpenseInThisBatch, ctx.user.currency);
          if (alert) budgetAlertsList.push(`${tx.category}: ${alert}`);
        }
      }

      const typeEnum = tx.type === "INCOME" ? TransactionType.INCOME : TransactionType.EXPENSE;

      // Multi-pass wallet detection
      let walletId: string | null = null;
      let walletLabel = "";

      const txDescLower = (tx.description || "").toLowerCase();
      const txCategoryLower = (tx.category || "").toLowerCase();

      // Pass 0: Use AI-extracted wallet name
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

      // Pass 1: Check AI description and category
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

      // Pass 2: Check raw message
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

      // Queue Wallet Balance Update
      if (walletId) {
        if (tx.type === "EXPENSE") {
          prismaOperations.push(
            prisma.wallet.update({ where: { id: walletId }, data: { balance: { decrement: tx.amount } } })
          );
        } else {
          prismaOperations.push(
            prisma.wallet.update({ where: { id: walletId }, data: { balance: { increment: tx.amount } } })
          );
        }
      }

      // Queue Transaction Creation
      prismaOperations.push(
        prisma.transaction.create({
          data: {
            type: typeEnum,
            amount: new Decimal(tx.amount),
            description: tx.description,
            user_id: ctx.user.id,
            category_id: categoryId,
            wallet_id: walletId,
          },
        })
      );

      const icon = tx.type === "INCOME" ? "📈" : "📉";
      reply += `\n${icon} *${tx.category}*\n`;
      reply += `   💰 Nominal: ${ctx.fmt(tx.amount)}\n`;
      if (tx.description) reply += `   📝 Ket: ${tx.description}\n`;
      if (walletLabel) reply += `   💳 Kantong: ${walletLabel}\n`;

      count++;
    } catch (txError) {
      console.error(`❌ Error parsing instruction for transaction:`, tx, txError);
      errors.push(`${tx.description}: Invalid data format locally`);
    }
  }

  // Execute all operations atomically in a single transaction
  if (prismaOperations.length > 0) {
    try {
      await prisma.$transaction(prismaOperations);
      console.log(`✅ ${prismaOperations.length} operations committed atomically.`);
    } catch (atomicError) {
      console.error("❌ Atomic transaction failed:", atomicError);
      return NextResponse.json({
        message: `❌ Terjadi kesalahan saat menyimpan transaksi:\n${atomicError instanceof Error ? atomicError.message : String(atomicError)}`
      });
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
