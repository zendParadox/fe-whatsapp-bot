import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { prisma } from "@/lib/prisma";
import { parseTransactionMessage } from "@/lib/whatsapp/parser";
import { checkBudgetStatus } from "@/lib/whatsapp/service";
import { formatInTimeZone } from "date-fns-tz";
import { id } from "date-fns/locale";
import type { CommandContext } from "../lib/context";
import { findAccessibleWallets } from "../lib/wallet-utils";

const TIMEZONE = "Asia/Jakarta";
const TRANSACTION_COMMANDS = new Set([
  "masuk",
  "income",
  "keluar",
  "expense",
  "in",
  "out",
]);

export async function handleTransaction(
  ctx: CommandContext,
): Promise<NextResponse | null> {
  const lines = ctx.message
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const transactionLines = lines.filter((line) => {
    const firstWord = line.split(" ")[0].toLowerCase();
    return TRANSACTION_COMMANDS.has(firstWord);
  });

  if (transactionLines.length === 0) return null;

  const results: { success: boolean; icon: string; text: string }[] = [];
  let totalIncome = 0;
  let totalExpense = 0;
  let successCount = 0;
  const budgetAlerts: string[] = [];

  const parsedItems = transactionLines.map((line) => ({
    line,
    parsed: parseTransactionMessage(line),
  }));

  const expenseSumsByCategory = new Map<string, number>();
  for (const item of parsedItems) {
    if (item.parsed && item.parsed.type === "EXPENSE") {
      const catLower = item.parsed.category.toLowerCase();
      expenseSumsByCategory.set(
        catLower,
        (expenseSumsByCategory.get(catLower) || 0) + item.parsed.amount,
      );
    }
  }

  const existingCategories = await prisma.category.findMany({
    where: { user_id: ctx.user.id },
  });
  const categoryMap = new Map<string, { id: string; name: string }>();
  existingCategories.forEach((c) =>
    categoryMap.set(c.name.toLowerCase(), { id: c.id, name: c.name }),
  );

  const isPremium = ctx.user.plan_type === "PREMIUM";
  const userWallets = isPremium ? await findAccessibleWallets(ctx.user.id) : [];

  const prismaOperations: Prisma.PrismaPromise<unknown>[] = [];
  const budgetCheckedCategories = new Set<string>();

  for (const { line, parsed: parsedData } of parsedItems) {
    if (!parsedData) {
      results.push({
        success: false,
        icon: "❌",
        text: `"${line.substring(0, 30)}${line.length > 30 ? "..." : ""}" - Format tidak valid`,
      });
      continue;
    }

    try {
      const catNameLower = parsedData.category.toLowerCase();
      let cat = categoryMap.get(catNameLower);

      if (!cat) {
        const newCategory = await prisma.category.create({
          data: { name: parsedData.category, user_id: ctx.user.id },
        });
        cat = { id: newCategory.id, name: newCategory.name };
        categoryMap.set(catNameLower, cat);
      }

      if (parsedData.type === "EXPENSE") {
        totalExpense += parsedData.amount;

        if (!budgetCheckedCategories.has(cat.id)) {
          budgetCheckedCategories.add(cat.id);
          const totalCatExpense = expenseSumsByCategory.get(catNameLower) || 0;

          const currency = "IDR";
          const alert = await checkBudgetStatus(
            ctx.user.id,
            cat.id,
            totalCatExpense,
            currency,
          );
          if (alert) budgetAlerts.push(`${cat.name}: ${alert}`);
        }
      } else {
        totalIncome += parsedData.amount;
      }

      let walletId: string | null = null;
      let walletLabel = "";

      for (const w of userWallets) {
        const walletRegex = new RegExp(`\\b${w.name}\\b`, "i");
        if (walletRegex.test(line)) {
          walletId = w.id;
          walletLabel = w.name;

          prismaOperations.push(
            prisma.wallet.update({
              where: { id: w.id },
              data: {
                balance: {
                  [parsedData.type === "EXPENSE" ? "decrement" : "increment"]:
                    parsedData.amount,
                },
              },
            }),
          );
          break;
        }
      }

      prismaOperations.push(
        prisma.transaction.create({
          data: {
            type: parsedData.type,
            amount: new Decimal(parsedData.amount),
            description: parsedData.description,
            user_id: ctx.user.id,
            category_id: cat.id,
            wallet_id: walletId,
          },
        }),
      );

      const icon = parsedData.type === "INCOME" ? "📈" : "📉";
      const formattedAmt = ctx.fmt(parsedData.amount);
      const walletInfo = walletLabel ? ` 💳${walletLabel}` : "";

      results.push({
        success: true,
        icon,
        text: `${formattedAmt} - ${parsedData.description} (${cat.name})${walletInfo}`,
      });

      successCount++;
    } catch (err) {
      console.error("[Transaction Error on line]:", line, err);
      results.push({
        success: false,
        icon: "❌",
        text: `"${parsedData.description}" - Gagal diproses`,
      });
    }
  }

  if (prismaOperations.length > 0) {
    try {
      await prisma.$transaction(prismaOperations);
    } catch (atomicError) {
      console.error("❌ Atomic manual transaction commit failed:", atomicError);
      return NextResponse.json({
        message:
          "❌ Terjadi kesalahan saat menyimpan transaksi. Seluruh operasi dibatalkan untuk menjaga keamanan data.",
      });
    }
  }

  const dateStr = formatInTimeZone(new Date(), TIMEZONE, "eeee, d MMMM yyyy", {
    locale: id,
  });

  if (transactionLines.length === 1 && successCount === 1) {
    const r = results[0];
    const parsedData = parsedItems[0].parsed!;
    const typeText = parsedData.type === "INCOME" ? "Pemasukan" : "Pengeluaran";

    let reply = `${r.icon} *${typeText} Tercatat!*\n━━━━━━━━━━━━━━━━━\n💰 *Nominal:* ${ctx.fmt(parsedData.amount)}\n📂 *Kategori:* ${parsedData.category}\n📝 *Keterangan:* ${parsedData.description}\n📅 *Tanggal:* ${dateStr}\n━━━━━━━━━━━━━━━━━`;

    if (budgetAlerts.length > 0)
      reply += `\n\n⚠️ *Peringatan Budget:*\n${budgetAlerts.join("\n")}`;
    reply += `\n\n💡 _Ketik "undo" untuk membatalkan_`;

    return NextResponse.json({ message: reply });
  }

  let reply = `📋 *Multi-Transaksi Tercatat!*\n📅 ${dateStr}\n━━━━━━━━━━━━━━━━━\n\n`;
  results.forEach((r) => {
    reply += `${r.icon} ${r.text}\n`;
  });

  reply += `\n━━━━━━━━━━━━━━━━━\n📊 *Ringkasan:*\n✅ Berhasil: ${successCount}/${transactionLines.length} baris\n`;
  if (totalIncome > 0) reply += `📈 Total Masuk: ${ctx.fmt(totalIncome)}\n`;
  if (totalExpense > 0) reply += `📉 Total Keluar: ${ctx.fmt(totalExpense)}\n`;
  if (budgetAlerts.length > 0)
    reply += `\n⚠️ *Peringatan Budget:*\n${budgetAlerts.join("\n")}`;

  return NextResponse.json({ message: reply });
}
