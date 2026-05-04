import { Prisma, TransactionType } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { prisma } from "@/lib/prisma";
import { checkBudgetStatus } from "@/lib/whatsapp/service";
import { formatInTimeZone } from "date-fns-tz";
import { id } from "date-fns/locale";
import { findAccessibleWallets } from "../lib/wallet-utils";
import { sendWhatsAppMessageAsync } from "@/lib/whatsapp/send";
import { formatMoneyBot } from "@/lib/phone";

const TIMEZONE = "Asia/Jakarta";

interface MetaAITransaction {
  type: string;
  amount: number;
  category: string;
  description?: string;
  wallet?: string;
}

interface MetaAIPayload {
  user_jid: string;
  transactions: MetaAITransaction[];
}

export async function handleMetaAIResponse(jsonPayload: MetaAIPayload) {
  const { user_jid, transactions } = jsonPayload;

  if (!user_jid) {
    console.log("🤖 Meta AI response missing user_jid, cannot route message.");
    return;
  }

  if (!transactions || transactions.length === 0) {
    console.log(`🤖 Meta AI returned empty transactions for user ${user_jid}`);
    sendWhatsAppMessageAsync(user_jid, "❌ Gagal memproses pesan dengan AI. Coba ubah sedikit kata-katanya ya!");
    return;
  }

  // Find User
  const user = await prisma.user.findUnique({
    where: { whatsapp_jid: user_jid },
  });

  if (!user) {
    console.error(`🤖 Meta AI User not found for JID: ${user_jid}`);
    return;
  }

  const fmt = (amount: number) => formatMoneyBot(amount, user.currency);

  const expenseSumsByCategory = new Map<string, number>();
  for (const tx of transactions) {
    if (tx.type === "EXPENSE") {
      const catLower = tx.category.toLowerCase();
      expenseSumsByCategory.set(
        catLower,
        (expenseSumsByCategory.get(catLower) || 0) + tx.amount,
      );
    }
  }

  const userWallets = await findAccessibleWallets(user.id);
  const prismaOperations: Prisma.PrismaPromise<unknown>[] = [];

  const budgetCheckedCategories = new Set<string>();
  const budgetAlertsList: string[] = [];
  const errors: string[] = [];
  let count = 0;

  const dateStr = formatInTimeZone(new Date(), TIMEZONE, "eeee, d MMMM yyyy", {
    locale: id,
  });
  let reply = `✨ *Asisten AI GoTEK*\n📅 ${dateStr}\n━━━━━━━━━━━━━━━━━\n`;

  // Fetch Categories for Caching
  const userCategories = await prisma.category.findMany({
    where: { user_id: user.id },
  });
  const categoryMap = new Map<string, string>();
  userCategories.forEach((c) => categoryMap.set(c.name.toLowerCase(), c.id));

  for (const tx of transactions) {
    try {
      const catNameLower = tx.category.toLowerCase();
      let categoryId = categoryMap.get(catNameLower);

      if (!categoryId) {
        const newCategory = await prisma.category.create({
          data: { name: tx.category, user_id: user.id },
        });
        categoryId = newCategory.id;
        categoryMap.set(catNameLower, categoryId);
      }

      if (tx.type === "EXPENSE" && !budgetCheckedCategories.has(categoryId)) {
        budgetCheckedCategories.add(categoryId);
        const totalCatExpense = expenseSumsByCategory.get(catNameLower) || 0;
        const alert = await checkBudgetStatus(user.id, categoryId, totalCatExpense, user.currency);
        if (alert) budgetAlertsList.push(`${tx.category}: ${alert}`);
      }

      let walletId: string | null = null;
      let walletLabel = "";

      if (tx.wallet) {
        const wMatch = userWallets.find((w) => w.name.toLowerCase() === tx.wallet!.toLowerCase());
        if (wMatch) {
          walletId = wMatch.id;
          walletLabel = wMatch.name;
        }
      }

      if (!walletId) {
        for (const w of userWallets) {
          const walletRegex = new RegExp(`\\b${w.name}\\b`, "i");
          if (walletRegex.test(tx.description || "") || walletRegex.test(tx.category || "")) {
            walletId = w.id;
            walletLabel = w.name;
            break;
          }
        }
      }

      if (walletId) {
        prismaOperations.push(
          prisma.wallet.update({
            where: { id: walletId },
            data: {
              balance: { [tx.type === "EXPENSE" ? "decrement" : "increment"]: tx.amount },
            },
          }),
        );
      }

      const typeEnum = tx.type === "INCOME" ? TransactionType.INCOME : TransactionType.EXPENSE;
      prismaOperations.push(
        prisma.transaction.create({
          data: {
            type: typeEnum,
            amount: new Decimal(tx.amount),
            description: tx.description,
            user_id: user.id,
            category_id: categoryId,
            wallet_id: walletId,
          },
        }),
      );

      const icon = tx.type === "INCOME" ? "📈" : "📉";
      reply += `\n${icon} *${tx.category}*\n   💰 Nominal: ${fmt(tx.amount)}\n`;
      if (tx.description) reply += `   📝 Ket: ${tx.description}\n`;
      if (walletLabel) reply += `   💳 Kantong: ${walletLabel}\n`;

      count++;
    } catch (txError) {
      console.error(`[AI TX Process Error]:`, tx, txError);
      errors.push(`${tx.description || "Transaksi"}: Gagal diproses sistem`);
    }
  }

  if (prismaOperations.length > 0) {
    try {
      await prisma.$transaction(prismaOperations);
    } catch (atomicError) {
      console.error("[Atomic AI Transaction Error]:", atomicError);
      sendWhatsAppMessageAsync(user_jid, `❌ Terjadi kesalahan saat menyimpan transaksi AI. Seluruh operasi dibatalkan.`);
      return;
    }
  }

  if (count > 0) {
    reply += `\n━━━━━━━━━━━━━━━━━\n✅ Berhasil mencatat ${count} transaksi.`;
    if (budgetAlertsList.length > 0)
      reply += `\n\n⚠️ *Peringatan Budget:*\n` + budgetAlertsList.map((a) => `• ${a}`).join("\n");
    if (errors.length > 0)
      reply += `\n\n⚠️ ${errors.length} transaksi gagal diproses.`;

    sendWhatsAppMessageAsync(user_jid, reply);
    return;
  }

  if (errors.length > 0) {
    sendWhatsAppMessageAsync(user_jid, `❌ AI Gagal mencatat transaksi:\n${errors.join("\n")}`);
  }
}
