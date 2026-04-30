import { NextResponse } from "next/server";
import { Prisma, TransactionType } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { prisma } from "@/lib/prisma";
import { parseTransactionWithAI } from "@/lib/ai-provider";
import { checkBudgetStatus } from "@/lib/whatsapp/service";
import { formatInTimeZone } from "date-fns-tz";
import { id } from "date-fns/locale";
import type { CommandContext } from "../lib/context";
import { findAccessibleWallets } from "../lib/wallet-utils";

const TIMEZONE = "Asia/Jakarta";

export async function handleAITransaction(
  ctx: CommandContext,
): Promise<NextResponse | null> {
  if (ctx.user.plan_type === "FREE") return null;

  // 1. Pre-fetch Data Pengguna
  const userCategories = await prisma.category.findMany({
    where: { user_id: ctx.user.id },
  });
  const categoryMap = new Map<string, string>(); // lowercase name -> id
  userCategories.forEach((c) => categoryMap.set(c.name.toLowerCase(), c.id));
  const categoryNames = userCategories.map((c) => c.name);

  // 2. Panggil AI Gemini
  let aiTransactions;
  try {
    aiTransactions = await parseTransactionWithAI(ctx.message, categoryNames);
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "GEMINI_RATE_LIMIT") {
      return NextResponse.json({
        message:
          "⚠️ *Limit AI Habis*\n\nMaaf, kuota penggunaan AI (Gemini) telah mencapai batas harian.\n\nSilakan gunakan format manual:\n`keluar [jumlah] [keterangan] [kategori]`\n\nContoh:\n`keluar 50k makan siang @makan`",
      });
    }
    if (error instanceof Error && error.message === "AI_ALL_PROVIDERS_DOWN") {
      return NextResponse.json({
        message:
          "🔧 *Server AI Sedang Sibuk*\n\nMaaf, semua layanan AI kami sedang mengalami lonjakan pengguna dan tidak dapat memproses permintaan saat ini.\n\n⏳ Silakan coba lagi dalam beberapa menit.\n\nAtau gunakan format manual:\n`keluar [jumlah] [keterangan] [kategori]`\n\nContoh:\n`keluar 50k makan siang @makan`\n`masuk 5jt gaji @kerja`",
      });
    }
    console.error("[AI Parse Error]:", error);
    return NextResponse.json({
      message:
        "❌ Gagal memproses pesan dengan AI. Coba ubah sedikit kata-katanya ya!",
    });
  }

  if (!aiTransactions || aiTransactions.length === 0) return null;

  // 3. Pre-kalkulasi Pengeluaran untuk Budget (O(N) optimasi)
  const expenseSumsByCategory = new Map<string, number>();
  for (const tx of aiTransactions) {
    if (tx.type === "EXPENSE") {
      const catLower = tx.category.toLowerCase();
      expenseSumsByCategory.set(
        catLower,
        (expenseSumsByCategory.get(catLower) || 0) + tx.amount,
      );
    }
  }

  // Pre-fetch wallets
  const userWallets = await findAccessibleWallets(ctx.user.id);
  const prismaOperations: Prisma.PrismaPromise<unknown>[] = [];

  const budgetCheckedCategories = new Set<string>();
  const budgetAlertsList: string[] = [];
  const errors: string[] = [];
  let count = 0;

  const dateStr = formatInTimeZone(new Date(), TIMEZONE, "eeee, d MMMM yyyy", {
    locale: id,
  });
  let reply = `✨ *Asisten AI GoTEK*\n📅 ${dateStr}\n━━━━━━━━━━━━━━━━━\n`;

  // 4. Proses Tiap Transaksi dari AI
  for (const tx of aiTransactions) {
    try {
      const catNameLower = tx.category.toLowerCase();
      let categoryId = categoryMap.get(catNameLower);

      // Buat kategori baru jika tidak ada
      if (!categoryId) {
        const newCategory = await prisma.category.create({
          data: { name: tx.category, user_id: ctx.user.id },
        });
        categoryId = newCategory.id;
        categoryMap.set(catNameLower, categoryId); // Cache agar tidak duplikat di loop selanjutnya
      }

      // Pengecekan Budget (Dieksekusi maksimal 1x per kategori unik)
      if (tx.type === "EXPENSE" && !budgetCheckedCategories.has(categoryId)) {
        budgetCheckedCategories.add(categoryId);
        const totalCatExpense = expenseSumsByCategory.get(catNameLower) || 0;

        const currency = "IDR";
        const alert = await checkBudgetStatus(
          ctx.user.id,
          categoryId,
          totalCatExpense,
          currency,
        );
        if (alert) budgetAlertsList.push(`${tx.category}: ${alert}`);
      }

      // --- Logika Pendeteksian Dompet (Multi-pass) yang Dioptimasi ---
      let walletId: string | null = null;
      let walletLabel = "";

      // Pass 0: Dari ekstraksi AI langsung
      if (tx.wallet) {
        const wMatch = userWallets.find(
          (w) => w.name.toLowerCase() === tx.wallet!.toLowerCase(),
        );
        if (wMatch) {
          walletId = wMatch.id;
          walletLabel = wMatch.name;
        }
      }

      // Pass 1: Regex Word Boundary pada Deskripsi & Kategori
      if (!walletId) {
        for (const w of userWallets) {
          const walletRegex = new RegExp(`\\b${w.name}\\b`, "i");
          if (
            walletRegex.test(tx.description || "") ||
            walletRegex.test(tx.category || "")
          ) {
            walletId = w.id;
            walletLabel = w.name;
            break;
          }
        }
      }

      // Pass 2: Fallback ke teks asli (hanya jika AI mendeteksi 1 transaksi saja)
      if (!walletId && aiTransactions.length === 1) {
        for (const w of userWallets) {
          const walletRegex = new RegExp(`\\b${w.name}\\b`, "i");
          if (walletRegex.test(ctx.lower)) {
            walletId = w.id;
            walletLabel = w.name;
            break;
          }
        }
      }

      // Tambahkan Operasi Saldo Dompet
      if (walletId) {
        prismaOperations.push(
          prisma.wallet.update({
            where: { id: walletId },
            data: {
              balance: {
                [tx.type === "EXPENSE" ? "decrement" : "increment"]: tx.amount,
              },
            },
          }),
        );
      }

      // Tambahkan Operasi Pembuatan Transaksi
      const typeEnum =
        tx.type === "INCOME" ? TransactionType.INCOME : TransactionType.EXPENSE;
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
        }),
      );

      const icon = tx.type === "INCOME" ? "📈" : "📉";
      reply += `\n${icon} *${tx.category}*\n   💰 Nominal: ${ctx.fmt(tx.amount)}\n`;
      if (tx.description) reply += `   📝 Ket: ${tx.description}\n`;
      if (walletLabel) reply += `   💳 Kantong: ${walletLabel}\n`;

      count++;
    } catch (txError) {
      console.error(`[AI TX Process Error]:`, tx, txError);
      errors.push(`${tx.description || "Transaksi"}: Gagal diproses sistem`);
    }
  }

  // 5. Eksekusi Atomik Database
  if (prismaOperations.length > 0) {
    try {
      await prisma.$transaction(prismaOperations);
    } catch (atomicError) {
      console.error("[Atomic AI Transaction Error]:", atomicError);
      return NextResponse.json({
        message: `❌ Terjadi kesalahan saat menyimpan transaksi AI. Seluruh operasi dibatalkan.`,
      });
    }
  }

  // 6. Format Hasil Akhir
  if (count > 0) {
    reply += `\n━━━━━━━━━━━━━━━━━\n✅ Berhasil mencatat ${count} transaksi.`;
    if (budgetAlertsList.length > 0)
      reply +=
        `\n\n⚠️ *Peringatan Budget:*\n` +
        budgetAlertsList.map((a) => `• ${a}`).join("\n");
    if (errors.length > 0)
      reply += `\n\n⚠️ ${errors.length} transaksi gagal diproses.`;

    return NextResponse.json({ message: reply });
  }

  if (errors.length > 0) {
    return NextResponse.json({
      message: `❌ AI Gagal mencatat transaksi:\n${errors.join("\n")}`,
    });
  }

  return null;
}
