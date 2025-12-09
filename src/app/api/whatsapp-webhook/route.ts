// file: src/app/api/whatsapp-webhook/route.ts

import { NextResponse, type NextRequest } from "next/server";
import {
  PrismaClient,
  TransactionType,
  PaymentMethodType,
  DebtType,
  DebtStatus
} from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { z } from "zod";
import { parseTransactionFromText } from "@/lib/gemini";

const prisma = new PrismaClient();

const webhookPayloadSchema = z.object({
  sender: z.string(),
  message: z.string(),
});

/**
 * Parses a string amount compatible with suffixes.
 * @example "50k" -> 50000
 * @example "1.5jt" -> 1500000
 * @example "50000" -> 50000
 */
function parseSmartAmount(amountStr: string): number | null {
  if (!amountStr) return null;
  const lower = amountStr.toLowerCase();
  let multiplier = 1;

  if (lower.endsWith("k") || lower.endsWith("rb")) {
    multiplier = 1000;
  } else if (lower.endsWith("jt") || lower.endsWith("juta") || lower.endsWith("m")) {
    multiplier = 1000000;
  }

  const cleanNum = parseFloat(lower.replace(/[^\d.,]/g, "").replace(",", "."));
  if (isNaN(cleanNum)) return null;

  return cleanNum * multiplier;
}

/**
 * Checks budget status for a specific category and month.
 * Returns a warning string if budget is exceeded or nearly exceeded.
 */
async function checkBudgetStatus(userId: string, categoryId: string, amount: number) {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const budget = await prisma.budget.findUnique({
    where: {
      user_id_category_id_month_year: {
        user_id: userId,
        category_id: categoryId,
        month: currentMonth,
        year: currentYear,
      },
    },
  });

  if (!budget) return null;

  // Calculate total expense for this category in current month
  const startOfMonth = new Date(currentYear, currentMonth - 1, 1);
  const endOfMonth = new Date(currentYear, currentMonth, 0);

  const aggregates = await prisma.transaction.aggregate({
    where: {
      user_id: userId,
      category_id: categoryId,
      type: "EXPENSE",
      created_at: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
    _sum: {
      amount: true,
    },
  });

  const totalExpense = (aggregates._sum.amount?.toNumber() || 0) + amount; // Include current transaction
  const budgetAmount = budget.amount.toNumber();

  if (totalExpense > budgetAmount) {
    const over = totalExpense - budgetAmount;
    return `\n\n⚠️ *PERINGATAN:* Budget kategori ini telah terlampaui sebesar Rp ${over.toLocaleString("id-ID")}!`;
  } else if (totalExpense > budgetAmount * 0.8) {
    const remaining = budgetAmount - totalExpense;
    return `\n\n📝 *Info:* Budget hampir habis. Sisa: Rp ${remaining.toLocaleString("id-ID")}`;
  }

  return null;
}

/**
 * Parses a WhatsApp message to extract transaction details.
 */
function parseTransactionMessage(message: string) {
  const parts = message.trim().split(" ");
  if (parts.length < 2) return null;

  const command = parts[0].toLowerCase();
  const amount = parseSmartAmount(parts[1]);

  if (amount === null || amount <= 0) return null;

  let type: TransactionType;
  if (["masuk", "income"].includes(command)) {
    type = TransactionType.INCOME;
  } else if (["keluar", "expense"].includes(command)) {
    type = TransactionType.EXPENSE;
  } else {
    return null;
  }

  const categoryMatch = message.match(/@(\w+)/);
  const category =
    categoryMatch && categoryMatch[1]
      ? categoryMatch[1].toLowerCase()
      : "lainnya";

  // Detect payment method (prefixed with '#')
  const paymentMethodMatch = message.match(/#(\w+)/);
  const paymentMethodString = paymentMethodMatch
    ? paymentMethodMatch[1].toUpperCase()
    : "CASH";

  // Validate and convert string to PaymentMethodType enum
  let paymentMethod: PaymentMethodType = PaymentMethodType.CASH; // Default
  if (
    Object.values(PaymentMethodType).includes(
      paymentMethodString as PaymentMethodType
    )
  ) {
    paymentMethod = paymentMethodString as PaymentMethodType;
  }

  const description = message
    .replace(new RegExp(`^${command}`, "i"), "")
    .replace(parts[1], "")
    .replace(/@\w+/g, "")
    .replace(/#\w+/g, "")
    .trim() || "Transaksi WhatsApp";

  return { type, amount, description, category, paymentMethod };
}

/**
 * Parses Debt message
 * Format: hutang 50k @Budi beli pulsa
 */
function parseDebtMessage(message: string) {
  const parts = message.trim().split(" ");
  if (parts.length < 3) return null; // cmd amount @person

  const command = parts[0].toLowerCase();
  const amount = parseSmartAmount(parts[1]);
  
  if (amount === null || amount <= 0) return null;

  let type: DebtType;
  if (command === "hutang") {
      type = DebtType.HUTANG;
  } else if (command === "piutang") {
      type = DebtType.PIUTANG;
  } else {
      return null;
  }

  const personMatch = message.match(/@(\w+)/);
  const personName = personMatch && personMatch[1] ? personMatch[1] : null;

  if (!personName) return null;

  const description = message
      .replace(new RegExp(`^${command}`, "i"), "")
      .replace(parts[1], "")
      .replace(/@\w+/g, "")
      .trim() || "Catatan Hutang";

  return { type, amount, personName, description };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = webhookPayloadSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: "Payload tidak valid." }, { status: 400 });
    }

    const { sender, message } = validation.data;
    const user = await prisma.user.findUnique({
      where: { whatsapp_jid: sender },
    });

    if (!user) {
      return NextResponse.json({
        message:
          "❌ Nomor Anda belum terdaftar. Silakan daftar terlebih dahulu di https://fe-whatsapp-bot.vercel.app/register",
      });
    }

    const args = message.trim().split(" ");
    const command = args[0].toLowerCase();

    // --- 1. HANDLE TRANSACTIONS (Masuk/Keluar) ---
    if (["masuk", "income", "keluar", "expense"].includes(command)) {
      const parsedData = parseTransactionMessage(message);

      if (!parsedData) {
        return NextResponse.json({
          message:
            "❌ Format salah.\n\nContoh:\n`keluar 50k kopi @minuman #gopay`\n`masuk 1.5jt gaji #bank`",
        });
      }

      let category = await prisma.category.findFirst({
        where: {
          user_id: user.id,
          name: { equals: parsedData.category, mode: "insensitive" },
        },
      });

      if (!category) {
        category = await prisma.category.create({
          data: { name: parsedData.category, user_id: user.id },
        });
      }

      // Check Budget if Expense
      let budgetAlert = "";
      if (parsedData.type === "EXPENSE") {
        const alert = await checkBudgetStatus(user.id, category.id, parsedData.amount);
        if (alert) budgetAlert = alert;
      }

      await prisma.transaction.create({
        data: {
          type: parsedData.type,
          amount: new Decimal(parsedData.amount),
          description: parsedData.description,
          user_id: user.id,
          category_id: category.id,
          payment_method: parsedData.type === "EXPENSE" ? parsedData.paymentMethod : null,
        },
      });

      const formattedAmount = `Rp ${parsedData.amount.toLocaleString("id-ID")}`;
      const typeText = parsedData.type === "INCOME" ? "Pemasukan" : "Pengeluaran";
      
      let reply = `✅ *${typeText} Tercatat!*`;
      reply += `\n💰 Nominal: ${formattedAmount}`;
      reply += `\n📂 Kategori: ${category.name}`;
      reply += `\n📝 Desc: ${parsedData.description}`;
      reply += budgetAlert;

      return NextResponse.json({ message: reply });
    }

    // --- 2. HANDLE BUDGET SETTING ---
    if (command === "budget" || command === "anggaran") {
      const amount = parseSmartAmount(args[1]);
      const categoryNameMatch = message.match(/@(\w+)/);
      const categoryName = categoryNameMatch ? categoryNameMatch[1] : null;

      if (!amount || !categoryName) {
        return NextResponse.json({
          message:
            "❌ Format budget salah.\n\nContoh:\n`budget 1jt @makan`",
        });
      }

      let category = await prisma.category.findFirst({
        where: {
          user_id: user.id,
          name: { equals: categoryName, mode: "insensitive" },
        },
      });

      if (!category) {
        category = await prisma.category.create({
          data: { name: categoryName, user_id: user.id },
        });
      }

      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();

      await prisma.budget.upsert({
        where: {
          user_id_category_id_month_year: {
            user_id: user.id,
            category_id: category.id,
            month: currentMonth,
            year: currentYear,
          },
        },
        update: { amount: new Decimal(amount) },
        create: {
          user_id: user.id,
          category_id: category.id,
          amount: new Decimal(amount),
          month: currentMonth,
          year: currentYear,
        },
      });

      return NextResponse.json({
        message: `✅ Budget *@${category.name}* untuk bulan ini berhasil diatur ke Rp ${amount.toLocaleString("id-ID")}`,
      });
    }

    // --- 3. REPORTS (Laporan) ---
    if (command === "laporan" || command === "report") {
        const type = args[1]?.toLowerCase();
        
        if (type === "hari" || type === "today" || type === "harian") {
             const startOfDay = new Date();
             startOfDay.setHours(0,0,0,0);
             const endOfDay = new Date();
             endOfDay.setHours(23,59,59,999);

             const transactions = await prisma.transaction.findMany({
                where: {
                    user_id: user.id,
                    created_at: { gte: startOfDay, lte: endOfDay }
                }
             });

             const income = transactions.filter(t => t.type === "INCOME").reduce((acc, t) => acc + t.amount.toNumber(), 0);
             const expense = transactions.filter(t => t.type === "EXPENSE").reduce((acc, t) => acc + t.amount.toNumber(), 0);

             return NextResponse.json({
                message: `📊 *Laporan Hari Ini*\n\n📈 Pemasukan: Rp ${income.toLocaleString("id-ID")}\n📉 Pengeluaran: Rp ${expense.toLocaleString("id-ID")}\n\nBalance: Rp ${(income - expense).toLocaleString("id-ID")}`
             });

        } else if (type === "bulan" || type === "month" || type === "bulanan") {
             const now = new Date();
             const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
             const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

             const transactions = await prisma.transaction.findMany({
                where: {
                    user_id: user.id,
                    created_at: { gte: startOfMonth, lte: endOfMonth }
                }
             });

             const income = transactions.filter(t => t.type === "INCOME").reduce((acc, t) => acc + t.amount.toNumber(), 0);
             const expense = transactions.filter(t => t.type === "EXPENSE").reduce((acc, t) => acc + t.amount.toNumber(), 0);

             return NextResponse.json({
                message: `📊 *Laporan Bulan Ini*\n\n📈 Pemasukan: Rp ${income.toLocaleString("id-ID")}\n📉 Pengeluaran: Rp ${expense.toLocaleString("id-ID")}\n\nBalance: Rp ${(income - expense).toLocaleString("id-ID")}`
             });
        }
    }

    // --- 4. CHECK BUDGET (Cek Budget) ---
    if (command === "cek" && (args[1] === "budget" || args[1] === "anggaran")) {
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        
        const budgets = await prisma.budget.findMany({
            where: { user_id: user.id, month: currentMonth, year: now.getFullYear() },
            include: { category: true }
        });

        if (budgets.length === 0) {
            return NextResponse.json({ message: "⚠️ Anda belum mengatur budget untuk bulan ini." });
        }

        let reply = "📊 *Status Budget Bulan Ini*\n";
        
        for (const b of budgets) {
             const aggregations = await prisma.transaction.aggregate({
                 where: {
                     user_id: user.id,
                     category_id: b.category_id,
                     type: "EXPENSE",
                     created_at: {
                         gte: new Date(now.getFullYear(), now.getMonth(), 1),
                         lte: new Date(now.getFullYear(), now.getMonth() + 1, 0)
                     }
                 },
                 _sum: { amount: true }
             });

             const used = aggregations._sum.amount?.toNumber() || 0;
             const total = b.amount.toNumber();
             const percent = Math.round((used / total) * 100);
             const icon = percent > 100 ? "🔴" : percent > 80 ? "🟡" : "🟢";

             reply += `\n${icon} *${b.category.name}*: ${percent}%`;
             reply += `\n   (Rp ${used.toLocaleString("id-ID")} / Rp ${total.toLocaleString("id-ID")})`;
        }

        return NextResponse.json({ message: reply });
    }

    // --- 5. UNDO (Hapus Transaksi Terakhir) ---
    if (command === "hapus" || command === "undo" || command === "batal") {
        const lastTx = await prisma.transaction.findFirst({
            where: { user_id: user.id },
            orderBy: { created_at: "desc" }
        });

        if (!lastTx) {
            return NextResponse.json({ message: "⚠️ Tidak ada transaksi yang bisa dihapus." });
        }

        const isToday = new Date().toDateString() === lastTx.created_at.toDateString();
        if (!isToday) {
             return NextResponse.json({ message: "⚠️ Hanya bisa menghapus transaksi hari ini." });
        }

        await prisma.transaction.delete({ where: { id: lastTx.id } });

        return NextResponse.json({ 
            message: `🗑️ Transaksi terakhir dihapus:\nRp ${lastTx.amount.toNumber().toLocaleString("id-ID")} (${lastTx.description})`
        });
    }

    // --- 6. DEBT MANAGER (Hutang/Piutang) ---
    if (command === "hutang" || command === "piutang") {
        const parsedData = parseDebtMessage(message);
        
        if (!parsedData) {
             return NextResponse.json({ 
                 message: `❌ Format salah.\n\nContoh:\n\`${command} 50k @Budi beli pulsa\``
             });
        }

        await prisma.debt.create({
            data: {
                user_id: user.id,
                type: parsedData.type,
                amount: new Decimal(parsedData.amount),
                person_name: parsedData.personName,
                description: parsedData.description,
                status: DebtStatus.UNPAID
            }
        });

        const typeLabel = parsedData.type === DebtType.HUTANG ? "Hutang ke" : "Piutang ke";
        
        return NextResponse.json({ 
            message: `📒 *Catat ${command.charAt(0).toUpperCase() + command.slice(1)} Berhasil!*\n\nAnda memiliki ${typeLabel} *${parsedData.personName}*\nJumlah: Rp ${parsedData.amount.toLocaleString("id-ID")}\nDesc: ${parsedData.description}`
        });
    }

    if (command === "cek" && (args[1] === "hutang" || args[1] === "piutang")) {
        const debts = await prisma.debt.findMany({
            where: { user_id: user.id, status: DebtStatus.UNPAID },
            orderBy: { created_at: "desc" }
        });

        if (debts.length === 0) {
            return NextResponse.json({ message: "🎉 Tidak ada hutang/piutang yang belum lunas!" });
        }

        let reply = "📒 *Daftar Hutang & Piutang Belum Lunas*\n";

        const hutangList = debts.filter(d => d.type === DebtType.HUTANG);
        const piutangList = debts.filter(d => d.type === DebtType.PIUTANG);

        if (hutangList.length > 0) {
            reply += "\n🔴 *HUTANG (Anda Pinjam)*\n";
            hutangList.forEach(d => {
                reply += `- Rp ${d.amount.toNumber().toLocaleString("id-ID")} ke *${d.person_name}* (${d.description})\n`;
            });
        }

        if (piutangList.length > 0) {
            reply += "\n🟢 *PIUTANG (Orang Pinjam)*\n";
            piutangList.forEach(d => {
                reply += `- Rp ${d.amount.toNumber().toLocaleString("id-ID")} dari *${d.person_name}* (${d.description})\n`;
            });
        }
        
        return NextResponse.json({ message: reply });
    }

    if (command === "lunas" || command === "bayar") {
        const personMatch = message.match(/@(\w+)/);
        const personName = personMatch && personMatch[1] ? personMatch[1] : null;

        if (!personName) {
            return NextResponse.json({ message: "❌ Sebutkan nama orang yang lunas.\nContoh: `lunas @Budi`" });
        }

        // Find UNPAID debts for this person
        const unpaidDebts = await prisma.debt.findMany({
            where: { 
                user_id: user.id, 
                person_name: { equals: personName, mode: "insensitive" },
                status: DebtStatus.UNPAID 
            }
        });

        if (unpaidDebts.length === 0) {
            return NextResponse.json({ message: `⚠️ Tidak ada hutang/piutang aktif dengan nama *${personName}*.` });
        }

        // Mark all as paid
        await prisma.debt.updateMany({
            where: {
                user_id: user.id,
                person_name: { equals: personName, mode: "insensitive" },
                status: DebtStatus.UNPAID
            },
            data: { status: DebtStatus.PAID }
        });

        return NextResponse.json({ message: `✅ Semua hutang/piutang dengan *${personName}* telah ditandai LUNAS! 🎉` });
    }


    // --- 7. HYBRID AI FALLBACK (Jika bukan command standar, coba AI) ---
    // Command standar yang sudah dihandle di atas: masuk, keluar, budget, laporan, cek, hapus/undo, hutang, piutang, lunas.
    // Jika sampai sini, berarti belum ada yang match.

    // Cek apakah ini pesan obrolan biasa atau transaksi natural
    // Kita panggil AI.
    const aiTransactions = await parseTransactionFromText(message);

    if (aiTransactions && aiTransactions.length > 0) {
      let reply = "✨ *Sistem AI (Gemini)*\n";
      let count = 0;

      for (const tx of aiTransactions) {
        // Cari/Buat Kategori
        let category = await prisma.category.findFirst({
          where: {
            user_id: user.id,
            name: { equals: tx.category, mode: "insensitive" },
          },
        });

        if (!category) {
          category = await prisma.category.create({
            data: { name: tx.category, user_id: user.id },
          });
        }

        // Cek Budget if Expense
        let budgetAlert = "";
        if (tx.type === "EXPENSE") {
          const alert = await checkBudgetStatus(user.id, category.id, tx.amount);
          if (alert) budgetAlert = alert;
        }

        const typeEnum =
          tx.type === "INCOME" ? TransactionType.INCOME : TransactionType.EXPENSE;

        await prisma.transaction.create({
          data: {
            type: typeEnum,
            amount: new Decimal(tx.amount),
            description: tx.description,
            user_id: user.id,
            category_id: category.id,
          },
        });

        const icon = tx.type === "INCOME" ? "📈" : "📉";
        reply += `\n${icon} *${tx.category}*: Rp ${tx.amount.toLocaleString("id-ID")}`;
        if (tx.description) reply += ` (${tx.description})`;
        if (budgetAlert) reply += ` ${budgetAlert}`;
        count++;
      }

      if (count > 0) {
        reply += `\n\n✅ Berhasil mencatat ${count} transaksi.`;
        return NextResponse.json({ message: reply });
      }
    }

    // --- 8. HANDLE HELP (Bantuan) ---
    const helpMessage = `👋 *GoTEK Bot Helper*

*1. 📝 Catat Transaksi*
Format: \`masuk/keluar <jumlah> [desc] @<kategori> #<metode>\`

*2. 📒 Hutang & Piutang* (BARU!)
- Hutang: \`hutang 50k @Budi\`
- Piutang: \`piutang 100k @Ani\`
- Cek: \`cek hutang\`
- Lunas: \`lunas @Budi\`

*3. 🎯 Budget*
- Set: \`budget 1jt @makan\`
- Cek: \`cek budget\`

*4. 📊 Laporan*
- \`laporan hari ini\`
- \`laporan bulan ini\`

*5. ↩️ Koreksi*
- \`undo\` / \`hapus\` (Hapus transaksi terakhir)

Selalu gunakan format yang benar! 🚀`;

    return NextResponse.json({ message: helpMessage });

  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json(
      { message: "Maaf, terjadi kesalahan internal di server." },
      { status: 500 }
    );
  }
}
