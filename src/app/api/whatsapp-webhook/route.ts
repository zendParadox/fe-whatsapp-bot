import { NextResponse, type NextRequest } from "next/server";
import {
  TransactionType,
  DebtType,
  DebtStatus
} from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { z } from "zod";
import { parseTransactionWithAI } from "@/lib/ai-provider";
import { normalizePhone, formatMoneyBot } from "@/lib/phone";

import { parseSmartAmount, parseTransactionMessage, parseDebtMessage } from "@/lib/whatsapp/parser";
import { checkBudgetStatus } from "@/lib/whatsapp/service";

import { prisma } from "@/lib/prisma";

const webhookPayloadSchema = z.object({
  sender: z.string(),
  message: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = webhookPayloadSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: "Payload tidak valid." }, { status: 400 });
    }

    const { sender, message } = validation.data;

    // Ekstrak bagian nomor/LID saja dari format apapun
    let rawSender = sender;
    if (rawSender.includes("@")) {
      rawSender = rawSender.split("@")[0];
    }
    // Hapus device identifier jika ada (misal 628xxx:1 -> 628xxx)
    if (rawSender.includes(":")) {
      rawSender = rawSender.split(":")[0];
    }
    rawSender = rawSender.replace(/\D/g, "");

    // Deteksi apakah ini LID (Linked ID) - LID biasanya > 15 digit
    // atau nomor yang tidak diawali country code 62/61/0 dan panjangnya > 10
    const isLid =
      rawSender.length > 15 ||
      (!rawSender.startsWith("62") &&
        !rawSender.startsWith("61") &&
        !rawSender.startsWith("0") &&
        rawSender.length > 10);

    let normalizedSender = rawSender;
    let lidValue: string | null = null;

    if (isLid) {
      lidValue = rawSender;
      console.log(`🔗 Detected LID format: ${lidValue}`);

      // Cari mapping LID -> phone di database
      const mapping = await prisma.lidMapping.findUnique({
        where: { lid: lidValue }
      });

      if (mapping) {
        normalizedSender = mapping.phone;
        console.log(`✅ Found LID mapping: ${lidValue} -> ${normalizedSender}`);
      } else {
        // Tidak ada mapping - cek apakah user sedang mendaftarkan nomornya
        const trimmedMessage = message.trim();

        // Jika pesan berupa nomor telepon (format: 08xxx atau 62xxx atau 61xxx)
        const phoneRegex = /^(\+?62|\+?61|0)[0-9]{8,12}$/;
        if (phoneRegex.test(trimmedMessage.replace(/[\s-]/g, ""))) {
          // User mengirim nomor telepon - simpan mapping
          const phoneToSave = normalizePhone(trimmedMessage);

          // Cari user dengan nomor tersebut
          const existingUser = await prisma.user.findUnique({
            where: { whatsapp_jid: phoneToSave }
          });

          if (existingUser) {
            // Simpan mapping
            await prisma.lidMapping.create({
              data: {
                lid: lidValue,
                phone: phoneToSave,
                user_id: existingUser.id
              }
            });

            console.log(`✅ Created LID mapping: ${lidValue} -> ${phoneToSave}`);
            return NextResponse.json({
              message: `✅ *Berhasil!*\n\nNomor *${phoneToSave}* telah terhubung dengan akun Anda.\n\nSekarang Anda bisa menggunakan bot dari WhatsApp Web/Desktop! 🎉`
            });
          } else {
            return NextResponse.json({
              message: `❌ Nomor *${phoneToSave}* belum terdaftar.\n\nSilakan daftar dulu di:\nhttps://gotek.vercel.app/register`
            });
          }
        }

        // Tidak ada mapping dan bukan nomor telepon - minta user daftarkan nomornya
        console.log(`⚠️ No LID mapping found for: ${lidValue}`);
        return NextResponse.json({
          message: `🔗 *Perangkat Tertaut Terdeteksi*\n\nAnda sedang menggunakan WhatsApp Web/Desktop.\n\nUntuk menghubungkan akun, silakan *balas pesan ini dengan nomor telepon Anda* yang sudah terdaftar.\n\nContoh: \`081234567890\``
        });
      }
    } else {
      // Bukan LID - normalisasi nomor telepon biasa
      normalizedSender = normalizePhone(normalizedSender);
    }

    console.log(`Webhook received sender: ${sender} -> Normalized: ${normalizedSender}${isLid ? ' (via LID mapping)' : ''}`);

    const user = await prisma.user.findUnique({
      where: { whatsapp_jid: normalizedSender },
    });

    if (!user) {
      console.log(`❌ User not found for sender: ${normalizedSender}`);
      return NextResponse.json({
        message:
          "❌ Nomor Anda belum terdaftar. Silakan daftar terlebih dahulu di https://gotek.vercel.app/register",
      });
    }

    // Currency-aware formatter based on user's country
    const fmt = (amount: number) => formatMoneyBot(amount, user.currency);

    // Update LID mapping dengan user_id jika belum ada
    if (lidValue) {
      await prisma.lidMapping.updateMany({
        where: { lid: lidValue, user_id: null },
        data: { user_id: user.id }
      });
    }

    // Handler untuk sapaan "Halo GoTEK Bot!"
    const trimmedMessage = message.trim().toLowerCase();
    if (trimmedMessage === "halo gotek bot!" || trimmedMessage === "halo gotek bot" || trimmedMessage === "hi" || trimmedMessage === "halo" || trimmedMessage === "hai") {
      const hour = new Date().getHours();
      const greeting = hour < 11 ? "Selamat pagi" : hour < 15 ? "Selamat siang" : hour < 18 ? "Selamat sore" : "Selamat malam";
      return NextResponse.json({
        message: `👋 *${greeting}, ${user.name || "Sobat GoTEK"}!*\n\n🤖 Saya *GoTEK Bot* - asisten pencatat keuangan Anda!\n\n📊 *Quick Stats Hari Ini:*\n_Loading data..._\n\n💡 *Tips:* Ketik *"help"* untuk panduan lengkap atau langsung catat transaksi:\n\`keluar 50k kopi @minuman\`\n\n🚀 Mulai catat keuanganmu sekarang!`
      });
    }

    const args = message.trim().split(" ");
    const command = args[0].toLowerCase();
    const lower = message.toLowerCase().trim();


    // Multi-Transaction Handler: supports single or multiple transactions separated by newline
    const transactionCommands = ["masuk", "income", "keluar", "expense", "in", "out"];
    const lines = message.split("\n").map(l => l.trim()).filter(l => l.length > 0);
    
    // Check if ANY line starts with a transaction command
    const transactionLines = lines.filter(line => {
      const firstWord = line.split(" ")[0].toLowerCase();
      return transactionCommands.includes(firstWord);
    });

    if (transactionLines.length > 0) {
      const results: { success: boolean; icon: string; text: string }[] = [];
      let totalIncome = 0;
      let totalExpense = 0;
      let successCount = 0;
      const budgetAlerts: string[] = [];

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
              user_id: user.id,
              name: { equals: parsedData.category, mode: "insensitive" },
            },
          });

          if (!category) {
            category = await prisma.category.create({
              data: { name: parsedData.category, user_id: user.id },
            });
          }

          // Check budget for expense
          if (parsedData.type === "EXPENSE") {
            const alert = await checkBudgetStatus(user.id, category.id, parsedData.amount, user.currency);
            if (alert) budgetAlerts.push(`${category.name}: ${alert}`);
            totalExpense += parsedData.amount;
          } else {
            totalIncome += parsedData.amount;
          }

          await prisma.transaction.create({
            data: {
              type: parsedData.type,
              amount: new Decimal(parsedData.amount),
              description: parsedData.description,
              user_id: user.id,
              category_id: category.id,
              // payment_method: parsedData.type === "EXPENSE" ? parsedData.paymentMethod : null, // Temporarily disabled
            },
          });

          const icon = parsedData.type === "INCOME" ? "📈" : "📉";
          const formattedAmt = fmt(parsedData.amount);
          results.push({
            success: true,
            icon,
            text: `${formattedAmt} - ${parsedData.description} (${category.name})`
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

      // Build response
      const dateStr = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' });
      
      if (transactionLines.length === 1 && successCount === 1) {
        // Single transaction - use original format
        const r = results[0];
        const parsedData = parseTransactionMessage(transactionLines[0])!;
        const typeText = parsedData.type === "INCOME" ? "Pemasukan" : "Pengeluaran";
        
        let reply = `${r.icon} *${typeText} Tercatat!*\n`;
        reply += `━━━━━━━━━━━━━━━━━\n`;
        reply += `💰 *Nominal:* ${fmt(parsedData.amount)}\n`;
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
        // Multi transaction - show summary
        let reply = `📋 *Multi-Transaksi Tercatat!*\n`;
        reply += `📅 ${dateStr}\n`;
        reply += `━━━━━━━━━━━━━━━━━\n\n`;
        
        // List all results
        results.forEach((r) => {
          reply += `${r.icon} ${r.text}\n`;
        });
        
        reply += `\n━━━━━━━━━━━━━━━━━\n`;
        reply += `📊 *Ringkasan:*\n`;
        reply += `✅ Berhasil: ${successCount}/${transactionLines.length} transaksi\n`;
        if (totalIncome > 0) reply += `📈 Total Masuk: ${fmt(totalIncome)}\n`;
        if (totalExpense > 0) reply += `📉 Total Keluar: ${fmt(totalExpense)}\n`;
        
        if (budgetAlerts.length > 0) {
          reply += `\n⚠️ *Peringatan Budget:*\n${budgetAlerts.join('\n')}`;
        }
        
        return NextResponse.json({ message: reply });
      }
    }


    if (command === "budget" || command === "anggaran") {
      const amount = parseSmartAmount(args[1]);
      const categoryNameMatch = message.match(/@(\w+)/);
      const categoryName = categoryNameMatch ? categoryNameMatch[1] : null;

      if (!amount || !categoryName) {
        return NextResponse.json({
          message:
            "❌ *Format Budget Salah*\n\n📌 *Format yang benar:*\n\`budget 1jt @makan\`\n\n📝 *Penjelasan:*\n• \`budget\` = Perintah set budget\n• \`1jt\` = Jumlah budget\n• \`@makan\` = Nama kategori\n\n💡 *Contoh lain:*\n\`budget 500k @transportasi\`\n\`budget 2jt @belanja\`",
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

      const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
      const monthName = monthNames[currentMonth - 1];

      return NextResponse.json({
        message: `🎯 *Budget Berhasil Diatur!*\n━━━━━━━━━━━━━━━━━\n📂 *Kategori:* ${category.name}\n💰 *Anggaran:* ${fmt(amount)}\n📅 *Periode:* ${monthName} ${currentYear}\n━━━━━━━━━━━━━━━━━\n\n💡 _Ketik \"cek budget\" untuk lihat status_`,
      });
    }


    if (command === "laporan" || command === "report") {
      const type = args[1]?.toLowerCase();

      if (type === "hari" || type === "today" || type === "harian") {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const transactions = await prisma.transaction.findMany({
          where: {
            user_id: user.id,
            created_at: { gte: startOfDay, lte: endOfDay }
          },
          include: { category: true }
        });

        const income = transactions.filter(t => t.type === "INCOME").reduce((acc, t) => acc + t.amount.toNumber(), 0);
        const expense = transactions.filter(t => t.type === "EXPENSE").reduce((acc, t) => acc + t.amount.toNumber(), 0);
        const balance = income - expense;
        const balanceEmoji = balance >= 0 ? "💚" : "💔";
        const txCount = transactions.length;
        const dateStr = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' });

        let reply = `📊 *Laporan Hari Ini*\n📅 ${dateStr}\n━━━━━━━━━━━━━━━━━\n`;
        reply += `📈 *Pemasukan:* ${fmt(income)}\n`;
        reply += `📉 *Pengeluaran:* ${fmt(expense)}\n`;
        reply += `━━━━━━━━━━━━━━━━━\n`;
        reply += `${balanceEmoji} *Balance:* ${fmt(balance)}\n`;
        reply += `📝 *Total Transaksi:* ${txCount} transaksi\n`;
        
        if (txCount > 0) {
          reply += `\n📋 *Detail Terakhir:*\n`;
          const lastTx = transactions.slice(-3).reverse();
          lastTx.forEach(t => {
            const icon = t.type === "INCOME" ? "➕" : "➖";
            reply += `${icon} ${fmt(t.amount.toNumber())} - ${t.description}\n`;
          });
        }

        return NextResponse.json({ message: reply });

      } else if (type === "bulan" || type === "month" || type === "bulanan") {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        const monthName = monthNames[now.getMonth()];

        const transactions = await prisma.transaction.findMany({
          where: {
            user_id: user.id,
            created_at: { gte: startOfMonth, lte: endOfMonth }
          },
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
        
        // Top 3 pengeluaran per kategori
        const expensesByCategory = transactions
          .filter(t => t.type === "EXPENSE")
          .reduce((acc, t) => {
            const catName = t.category?.name || "Lainnya";
            acc[catName] = (acc[catName] || 0) + t.amount.toNumber();
            return acc;
          }, {} as Record<string, number>);
        
        const topExpenses = Object.entries(expensesByCategory)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3);
        
        if (topExpenses.length > 0) {
          reply += `🔥 *Top Pengeluaran:*\n`;
          topExpenses.forEach(([cat, amt], i) => {
            const medals = ['🥇', '🥈', '🥉'];
            reply += `${medals[i]} ${cat}: Rp ${amt.toLocaleString("id-ID")}\n`;
          });
        }

        return NextResponse.json({ message: reply });
      } else if (type === "minggu" || type === "week" || type === "mingguan") {
        const now = new Date();
        const day = now.getDay(); // 0 (Sun) - 6 (Sat)
        // Adjust to Monday start
        const diffToMonday = now.getDate() - day + (day === 0 ? -6 : 1);
        
        const startOfWeek = new Date(now);
        startOfWeek.setDate(diffToMonday);
        startOfWeek.setHours(0, 0, 0, 0);
        
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        const formatDate = (d: Date) => d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
        const periodStr = `${formatDate(startOfWeek)} - ${formatDate(endOfWeek)}`;

        const transactions = await prisma.transaction.findMany({
          where: {
            user_id: user.id,
            created_at: { gte: startOfWeek, lte: endOfWeek }
          },
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

        // Top 3 pengeluaran per kategori
        const expensesByCategory = transactions
          .filter(t => t.type === "EXPENSE")
          .reduce((acc, t) => {
            const catName = t.category?.name || "Lainnya";
            acc[catName] = (acc[catName] || 0) + t.amount.toNumber();
            return acc;
          }, {} as Record<string, number>);
        
        const topExpenses = Object.entries(expensesByCategory)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3);
        
        if (topExpenses.length > 0) {
          reply += `🔥 *Top Pengeluaran:*\n`;
          topExpenses.forEach(([cat, amt], i) => {
            const medals = ['🥇', '🥈', '🥉'];
            reply += `${medals[i]} ${cat}: Rp ${amt.toLocaleString("id-ID")}\n`;
          });
        }

        return NextResponse.json({ message: reply });
      }

    }

    if (command === "saldo" || command === "ceksaldo" || (command === "cek" && args[1] === "saldo")) {
      const transactions = await prisma.transaction.groupBy({
        by: ["type"],
        where: { user_id: user.id },
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
      reply += `📈 *Total Pemasukan:*\n${fmt(totalIncome)}\n\n`;
      reply += `📉 *Total Pengeluaran:*\n${fmt(totalExpense)}\n━━━━━━━━━━━━━━━━━\n`;
      reply += `${balanceEmoji} *Saldo Akhir (All-time):*\n*${fmt(totalSaldo)}*\n\n`;
      reply += `💡 _Ketik "laporan bulan" untuk detail bulan ini_`;

      return NextResponse.json({ message: reply });
    }

    if (command === "cek" && (args[1] === "budget" || args[1] === "anggaran")) {
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

      const budgets = await prisma.budget.findMany({
        where: { user_id: user.id, month: currentMonth, year: now.getFullYear() },
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
        reply += `   💸 Terpakai: ${fmt(used)}\n`;
        reply += `   💰 Sisa: ${fmt(remaining)}\n`;
      }

      reply += `\n💡 _Ketik \"laporan bulan\" untuk detail lengkap_`;

      return NextResponse.json({ message: reply });
    }


    if (command === "hapus" || command === "undo" || command === "batal") {
      const lastTx = await prisma.transaction.findFirst({
        where: { user_id: user.id },
        orderBy: { created_at: "desc" },
        include: { category: true }
      });

      if (!lastTx) {
        return NextResponse.json({ message: "⚠️ *Tidak Ada Transaksi*\n\nTidak ada transaksi yang bisa dihapus. Mulai catat transaksi baru!" });
      }

      const isToday = new Date().toDateString() === lastTx.created_at.toDateString();
      if (!isToday) {
        return NextResponse.json({ 
          message: `⚠️ *Tidak Bisa Dihapus*\n\nTransaksi terakhir sudah bukan hari ini.\nHanya transaksi hari ini yang bisa di-undo.\n\n📝 *Transaksi terakhir:*\nRp ${lastTx.amount.toNumber().toLocaleString("id-ID")} - ${lastTx.description}\n(Tanggal: ${lastTx.created_at.toLocaleDateString('id-ID')})` 
        });
      }

      await prisma.transaction.delete({ where: { id: lastTx.id } });

      const typeEmoji = lastTx.type === "INCOME" ? "📈" : "📉";
      const typeText = lastTx.type === "INCOME" ? "Pemasukan" : "Pengeluaran";

      return NextResponse.json({
        message: `🗑️ *Transaksi Dihapus!*\n━━━━━━━━━━━━━━━━━\n${typeEmoji} *Tipe:* ${typeText}\n💰 *Nominal:* Rp ${lastTx.amount.toNumber().toLocaleString("id-ID")}\n📂 *Kategori:* ${lastTx.category?.name || '-'}\n📝 *Keterangan:* ${lastTx.description}\n━━━━━━━━━━━━━━━━━\n\n✅ Transaksi sudah dibatalkan`
      });
    }


    if (command === "hutang" || command === "piutang") {
      const parsedData = parseDebtMessage(message);

      if (!parsedData) {
        const exampleType = command === "hutang" ? "hutang" : "piutang";
        const explanation = command === "hutang" ? "Anda meminjam uang dari orang lain" : "Orang lain meminjam uang dari Anda";
        return NextResponse.json({
          message: `❌ *Format ${command.charAt(0).toUpperCase() + command.slice(1)} Salah*\n\n📌 *Format yang benar:*\n\`${exampleType} 50k @Budi beli pulsa\`\n\n📝 *Penjelasan:*\n• \`${exampleType}\` = ${explanation}\n• \`50k\` = Jumlah (k=ribu, jt=juta)\n• \`@Budi\` = Nama orang\n• \`beli pulsa\` = Keterangan\n\n💡 *Contoh lain:*\n\`${exampleType} 1jt @Ani modal usaha\`\n\`${exampleType} 200k @Doni bayar makan\``
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

      const isHutang = parsedData.type === DebtType.HUTANG;
      const emoji = isHutang ? "🔴" : "🟢";
      const typeLabel = isHutang ? "HUTANG" : "PIUTANG";
      const relation = isHutang ? "Anda meminjam dari" : "Anda meminjamkan ke";

      return NextResponse.json({
        message: `${emoji} *${typeLabel} Tercatat!*\n━━━━━━━━━━━━━━━━━\n👤 *${relation}:* ${parsedData.personName}\n💰 *Jumlah:* Rp ${parsedData.amount.toLocaleString("id-ID")}\n📝 *Keterangan:* ${parsedData.description}\n📅 *Tanggal:* ${new Date().toLocaleDateString('id-ID')}\n━━━━━━━━━━━━━━━━━\n\n💡 _Ketik \"cek hutang\" untuk lihat daftar_\n💡 _Ketik \"lunas @${parsedData.personName}\" jika sudah dibayar_`
      });
    }

    if (command === "cek" && (args[1] === "hutang" || args[1] === "piutang")) {
      const debts = await prisma.debt.findMany({
        where: { user_id: user.id, status: DebtStatus.UNPAID },
        orderBy: { created_at: "desc" }
      });

      if (debts.length === 0) {
        return NextResponse.json({ 
          message: "🎉 *Selamat!*\n\nTidak ada hutang/piutang yang belum lunas!\n\nKeuangan Anda bersih! 💚" 
        });
      }

      const hutangList = debts.filter(d => d.type === DebtType.HUTANG);
      const piutangList = debts.filter(d => d.type === DebtType.PIUTANG);
      const totalHutang = hutangList.reduce((acc, d) => acc + d.amount.toNumber(), 0);
      const totalPiutang = piutangList.reduce((acc, d) => acc + d.amount.toNumber(), 0);

      let reply = `📒 *Daftar Hutang & Piutang*\n━━━━━━━━━━━━━━━━━\n`;

      if (hutangList.length > 0) {
        reply += `\n🔴 *HUTANG* (Anda Pinjam)\n`;
        reply += `💰 Total: Rp ${totalHutang.toLocaleString("id-ID")}\n\n`;
        hutangList.forEach((d, i) => {
          reply += `${i + 1}. *${d.person_name}*\n`;
          reply += `   Rp ${d.amount.toNumber().toLocaleString("id-ID")}\n`;
          if (d.description) reply += `   📝 ${d.description}\n`;
        });
      }

      if (piutangList.length > 0) {
        if (hutangList.length > 0) reply += `\n`;
        reply += `🟢 *PIUTANG* (Orang Pinjam ke Anda)\n`;
        reply += `💰 Total: Rp ${totalPiutang.toLocaleString("id-ID")}\n\n`;
        piutangList.forEach((d, i) => {
          reply += `${i + 1}. *${d.person_name}*\n`;
          reply += `   Rp ${d.amount.toNumber().toLocaleString("id-ID")}\n`;
          if (d.description) reply += `   📝 ${d.description}\n`;
        });
      }

      reply += `\n━━━━━━━━━━━━━━━━━\n`;
      reply += `📊 *Summary:*\n`;
      reply += `🔴 Hutang: Rp ${totalHutang.toLocaleString("id-ID")} (${hutangList.length} orang)\n`;
      reply += `🟢 Piutang: Rp ${totalPiutang.toLocaleString("id-ID")} (${piutangList.length} orang)\n`;
      
      const netBalance = totalPiutang - totalHutang;
      const netEmoji = netBalance >= 0 ? "💚" : "💔";
      reply += `${netEmoji} Net: Rp ${netBalance.toLocaleString("id-ID")}\n`;
      reply += `\n💡 _Ketik \"lunas @Nama\" jika sudah dibayar_`;

      return NextResponse.json({ message: reply });
    }

    if (command === "lunas" || command === "bayar") {
      const personMatch = message.match(/@(\w+)/);
      const personName = personMatch && personMatch[1] ? personMatch[1] : null;

      if (!personName) {
        return NextResponse.json({ 
          message: "❌ *Format Lunas Salah*\n\n📌 *Format yang benar:*\n\`lunas @Budi\`\n\n📝 *Penjelasan:*\nSebutkan nama orang yang hutang/piutangnya sudah dibayar.\n\n💡 _Ketik \"cek hutang\" untuk lihat daftar_" 
        });
      }

      const unpaidDebts = await prisma.debt.findMany({
        where: {
          user_id: user.id,
          person_name: { equals: personName, mode: "insensitive" },
          status: DebtStatus.UNPAID
        }
      });

      if (unpaidDebts.length === 0) {
        return NextResponse.json({ 
          message: `⚠️ *Tidak Ditemukan*\n\nTidak ada hutang/piutang aktif dengan nama *${personName}*.\n\n💡 _Cek penulisan nama atau ketik \"cek hutang\"_` 
        });
      }

      const totalAmount = unpaidDebts.reduce((acc, d) => acc + d.amount.toNumber(), 0);
      const hasHutang = unpaidDebts.some(d => d.type === DebtType.HUTANG);
      const hasPiutang = unpaidDebts.some(d => d.type === DebtType.PIUTANG);

      await prisma.debt.updateMany({
        where: {
          user_id: user.id,
          person_name: { equals: personName, mode: "insensitive" },
          status: DebtStatus.UNPAID
        },
        data: { status: DebtStatus.PAID }
      });

      let typeInfo = "";
      if (hasHutang && hasPiutang) typeInfo = "hutang & piutang";
      else if (hasHutang) typeInfo = "hutang";
      else typeInfo = "piutang";

      return NextResponse.json({ 
        message: `✅ *LUNAS!*\n━━━━━━━━━━━━━━━━━\n👤 *Nama:* ${personName}\n💰 *Total:* Rp ${totalAmount.toLocaleString("id-ID")}\n📒 *Jenis:* ${unpaidDebts.length} ${typeInfo}\n━━━━━━━━━━━━━━━━━\n\n🎉 Semua ${typeInfo} dengan *${personName}* sudah lunas!` 
      });
    }



    // =================== KANTONG (WALLET) COMMANDS ===================
    if (command === "kantong" || command === "wallet" || command === "dompet") {
      if ((user as Record<string, unknown>).plan_type !== "PREMIUM") {
        return NextResponse.json({
          message: "👑 *Fitur Premium*\n\nFitur Kantong Keuangan hanya untuk pengguna Premium.\nUpgrade di 🔗 https://gotek.vercel.app/pricing"
        });
      }
      const wallets = await prisma.wallet.findMany({
        where: { user_id: user.id },
        orderBy: { created_at: "asc" },
      });
      if (wallets.length === 0) {
        return NextResponse.json({
          message: "💰 *Kantong Keuangan*\n\nBelum ada kantong. Buat dengan:\n_tambah kantong [nama] [saldo_awal]_\n\nContoh:\n`tambah kantong BCA 5000000`\n`tambah kantong Gopay 150000`"
        });
      }
      let totalAll = 0;
      let list = "💰 *Kantong Keuangan Anda*\n━━━━━━━━━━━━━━━━━\n";
      for (const w of wallets) {
        const bal = Number(w.balance);
        totalAll += bal;
        list += `\n${w.icon || "💰"} *${w.name}*: Rp ${bal.toLocaleString("id-ID")}`;
      }
      list += `\n━━━━━━━━━━━━━━━━━\n💎 *Total:* Rp ${totalAll.toLocaleString("id-ID")}`;
      return NextResponse.json({ message: list });
    }

    // Tambah kantong: "tambah kantong BCA 5000000"
    if (lower.startsWith("tambah kantong") || lower.startsWith("buat kantong") || lower.startsWith("tambah wallet")) {
      if ((user as Record<string, unknown>).plan_type !== "PREMIUM") {
        return NextResponse.json({
          message: "👑 *Fitur Premium*\n\nFitur Kantong Keuangan hanya untuk pengguna Premium.\nUpgrade di 🔗 https://gotek.vercel.app/pricing"
        });
      }
      const parts = message.replace(/^(tambah|buat)\s+(kantong|wallet)\s+/i, "").trim().split(/\s+/);
      const walletName = parts[0];
      const initialBalance = parts[1] ? Number(parts[1].replace(/[^\d]/g, "")) : 0;

      if (!walletName) {
        return NextResponse.json({
          message: "⚠️ Format: `tambah kantong [nama] [saldo_awal]`\n\nContoh: `tambah kantong BCA 5000000`"
        });
      }

      try {
        const newWallet = await prisma.wallet.create({
          data: {
            user_id: user.id,
            name: walletName,
            balance: initialBalance,
          },
        });
        return NextResponse.json({
          message: `✅ Kantong *${newWallet.name}* berhasil dibuat!\n💰 Saldo awal: Rp ${initialBalance.toLocaleString("id-ID")}`
        });
      } catch {
        return NextResponse.json({
          message: `⚠️ Kantong "${walletName}" sudah ada atau terjadi error.`
        });
      }
    }

    // Transfer antar kantong: "transfer 500k dari bca ke gopay"
    const transferMatch = lower.match(/^transfer\s+([\d.,]+[kmjbt]?)\s+dari\s+(\w+)\s+ke\s+(\w+)$/i);
    if (transferMatch) {
      if ((user as Record<string, unknown>).plan_type !== "PREMIUM") {
        return NextResponse.json({
          message: "👑 *Fitur Premium*\n\nFitur Transfer antar Kantong hanya untuk pengguna Premium."
        });
      }
      let amount = parseFloat(transferMatch[1].replace(/,/g, ".").replace(/[^\d.]/g, ""));
      const suffix = transferMatch[1].slice(-1).toLowerCase();
      if (suffix === "k") amount *= 1000;
      else if (suffix === "j" || suffix === "m") amount *= 1000000;
      else if (suffix === "b" || suffix === "t") amount *= 1000000000;

      const fromName = transferMatch[2];
      const toName = transferMatch[3];

      const fromWallet = await prisma.wallet.findFirst({
        where: { user_id: user.id, name: { equals: fromName, mode: "insensitive" } },
      });
      const toWallet = await prisma.wallet.findFirst({
        where: { user_id: user.id, name: { equals: toName, mode: "insensitive" } },
      });

      if (!fromWallet) return NextResponse.json({ message: `⚠️ Kantong "${fromName}" tidak ditemukan.` });
      if (!toWallet) return NextResponse.json({ message: `⚠️ Kantong "${toName}" tidak ditemukan.` });

      // Deduct from source, add to destination
      await prisma.wallet.update({
        where: { id: fromWallet.id },
        data: { balance: { decrement: amount } },
      });
      await prisma.wallet.update({
        where: { id: toWallet.id },
        data: { balance: { increment: amount } },
      });

      return NextResponse.json({
        message: `🔄 *Transfer Berhasil!*\n━━━━━━━━━━━━━━━━━\n📤 Dari: *${fromWallet.name}*\n📥 Ke: *${toWallet.name}*\n💰 Jumlah: Rp ${amount.toLocaleString("id-ID")}\n━━━━━━━━━━━━━━━━━\n\nSaldo ${fromWallet.name}: Rp ${(Number(fromWallet.balance) - amount).toLocaleString("id-ID")}\nSaldo ${toWallet.name}: Rp ${(Number(toWallet.balance) + amount).toLocaleString("id-ID")}`
      });
    }

    if ((user as Record<string, unknown>).plan_type === "FREE") {
      return NextResponse.json({
        message:
          "👑 *Fitur Premium*\n\nMaaf, fitur ini hanya untuk pengguna Premium.\n\nDengan upgrade, Anda mendapatkan:\n✅ AI Smart Parser — ketik bebas, langsung tercatat\n📸 Scan Struk — kirim foto, otomatis tercatat\n💰 Kantong Keuangan — lacak saldo bank & e-wallet\n📤 Export PDF & Excel\n📊 AI Analysis — insight keuangan bulanan\n\nSilakan gunakan format manual:\n`keluar [jumlah] [keterangan] [kategori]`\n\nAtau upgrade sekarang:\n🔗 https://gotek.vercel.app/pricing",
      });
    }

    if (command === "upgrade" || command === "premium") {
      const isPremium = (user as Record<string, unknown>).plan_type === "PREMIUM";
      if (isPremium) {
        return NextResponse.json({
          message: `👑 *Status Premium Aktif*\n━━━━━━━━━━━━━━━━━\nTerima kasih, ${user.name || "Sobat GoTEK"}! Anda pelanggan Premium.\n\n🔓 *Fitur Aktif Anda:*\n✅ AI Smart Parser (ketik bebas)\n📸 Scan Struk otomatis\n💰 Kantong Keuangan (bank & e-wallet)\n📤 Export Laporan PDF & Excel\n📊 Analisis Keuangan AI Bulanan\n🎯 Kategori Budget tak terbatas\n━━━━━━━━━━━━━━━━━\n\n💡 Ketik *kantong* untuk cek saldo kantong Anda.`
        });
      }

      return NextResponse.json({
        message: `⭐️ *Upgrade ke GoTEK Premium!* ⭐️\n\nBuka semua fitur AI Asisten Keuangan:\n✅ AI Smart Parser — ketik bebas, langsung tercatat\n📸 Scan Struk — kirim foto, auto tercatat\n💰 Kantong Keuangan — lacak saldo bank & e-wallet\n📤 Export Laporan PDF & Excel\n📊 AI Financial Analysis bulanan\n🎯 Kategori Budget tak terbatas\n\n🔥 *PROMO 100 Pendaftar Pertama!*\n~Rp 29.000~ → *Rp 15.000/Bulan*\n\nUpgrade sekarang:\n🔗 https://gotek.vercel.app/pricing\n\n💡 _Dukung karya anak bangsa. Kami juga butuh kopi!_ ☕`
      });
    }


    let aiTransactions;
    try {
      aiTransactions = await parseTransactionWithAI(message);
    } catch (error: unknown) {
      if (error instanceof Error && error.message === "GEMINI_RATE_LIMIT") {
        return NextResponse.json({
          message:
            "⚠️ *Limit AI Habis*\n\nMaaf, kuota penggunaan AI (Gemini) telah mencapai batas harian.\n\nSilakan gunakan format manual:\n`keluar [jumlah] [keterangan] [kategori]`\n\nContoh:\n`keluar 50k makan siang @makan`",
        });
      }
      console.error("❌ Error parsing AI transaction:", error);
    }

    if (aiTransactions && aiTransactions.length > 0) {
      let reply = "✨ *Sistem AI (Gemini)*\n";
      let count = 0;
      const errors: string[] = [];

      for (const tx of aiTransactions) {
        try {
          console.log(`📝 Processing transaction: ${tx.description} (${tx.amount})`);

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
            console.log(`✅ Created category: ${tx.category}`);
          }

          let budgetAlert = "";
          if (tx.type === "EXPENSE") {
            const alert = await checkBudgetStatus(user.id, category.id, tx.amount);
            if (alert) budgetAlert = alert;
          }

          const typeEnum =
            tx.type === "INCOME" ? TransactionType.INCOME : TransactionType.EXPENSE;

          // Deteksi kantong dari pesan (keyword "dari [nama]" atau "ke [nama]")
          let walletId: string | null = null;
          let walletLabel = "";
          const walletFromMatch = lower.match(/(?:dari|pakai|pake|via|lewat)\s+(\w+)/i);
          const walletToMatch = lower.match(/(?:ke|masuk)\s+(\w+)/i);
          const walletKeyword = tx.type === "INCOME" ? walletToMatch?.[1] : walletFromMatch?.[1];

          if (walletKeyword) {
            const foundWallet = await prisma.wallet.findFirst({
              where: { user_id: user.id, name: { equals: walletKeyword, mode: "insensitive" } },
            });
            if (foundWallet) {
              walletId = foundWallet.id;
              walletLabel = foundWallet.name;
              // Update saldo wallet
              if (tx.type === "EXPENSE") {
                await prisma.wallet.update({
                  where: { id: foundWallet.id },
                  data: { balance: { decrement: tx.amount } },
                });
              } else {
                await prisma.wallet.update({
                  where: { id: foundWallet.id },
                  data: { balance: { increment: tx.amount } },
                });
              }
            }
          }

          await prisma.transaction.create({
            data: {
              type: typeEnum,
              amount: new Decimal(tx.amount),
              description: tx.description,
              user_id: user.id,
              category_id: category.id,
              wallet_id: walletId,
            },
          });

          const icon = tx.type === "INCOME" ? "📈" : "📉";
          reply += `\n${icon} *${tx.category}*: Rp ${tx.amount.toLocaleString("id-ID")}`;
          if (tx.description) reply += ` (${tx.description})`;
          if (walletLabel) reply += ` 💰 ${walletLabel}`;
          if (budgetAlert) reply += ` ${budgetAlert}`;
          count++;
          console.log(`✅ Transaction saved: ${tx.description}`);
        } catch (txError) {
          console.error(`❌ Error processing transaction:`, tx, txError);
          const errorMessage = txError instanceof Error ? txError.message : String(txError);
          errors.push(`${tx.description}: ${errorMessage}`);
        }
      }

      if (count > 0) {
        reply += `\n\n✅ Berhasil mencatat ${count} transaksi.`;
        if (errors.length > 0) {
          reply += `\n⚠️ ${errors.length} transaksi gagal.`;
        }
        return NextResponse.json({ message: reply });
      } else if (errors.length > 0) {
        console.error("❌ All transactions failed:", errors);
        return NextResponse.json({
          message: `❌ Gagal mencatat transaksi:\n${errors.join('\n')}`
        });
      }
    }

    // Command: penjelasan detail / tutorial
    if (trimmedMessage === "penjelasan detail" || trimmedMessage === "tutorial" || trimmedMessage === "panduan") {
      const detailedHelp = `📖 *PANDUAN LENGKAP GOTEK BOT*
━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔹 *1. CATAT PENGELUARAN*
Format: \`keluar [jumlah] [keterangan] @[kategori]\`

*Contoh:*
• \`keluar 18k beli sabun mandi @kebutuhan pribadi\`
• \`keluar 50k makan siang @makan\`
• \`keluar 100k belanja @kebutuhan rumah\`

📝 *Penjelasan:*
- \`keluar\` = tipe pengeluaran (bisa juga: expense, out)
- \`18k\` = Rp 18.000 (k=ribu, jt=juta, rb=ribu)
- \`beli sabun mandi\` = keterangan transaksi
- \`@kebutuhan pribadi\` = kategori (bisa lebih dari 1 kata!)

━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔹 *2. CATAT PEMASUKAN*
Format: \`masuk [jumlah] [keterangan] @[kategori]\`

*Contoh:*
• \`masuk 5jt gaji bulan februari @pekerjaan\`
• \`masuk 500k uang freelance @kerja sampingan\`
• \`masuk 1.5jt bonus tahunan @bonus\`

━━━━━━━━━━━━━━━━━━━━━━━━━━━
� *3. HUTANG & PIUTANG*
• \`hutang 100k @Budi pinjam modal\` - Anda pinjam dari Budi
• \`piutang 50k @Ani buat pulsa\` - Ani pinjam dari Anda
• \`cek hutang\` - Lihat semua hutang/piutang
• \`lunas @Budi\` - Tandai lunas

━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔹 *4. BUDGET*
• \`budget 1jt @makan\` - Set budget kategori
• \`cek budget\` - Lihat status budget

━━━━━━━━━━━━━━━━━━━━━━━━━━━
� *5. LAPORAN*
• \`laporan hari\` - Ringkasan hari ini
• \`laporan minggu\` - Ringkasan minggu ini
• \`laporan bulan\` - Ringkasan bulan ini

━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔹 *6. KOREKSI*
• \`undo\` atau \`hapus\` - Batalkan transaksi terakhir

━━━━━━━━━━━━━━━━━━━━━━━━━━━
👑 *7. KANTONG KEUANGAN* _(Premium)_
• \`kantong\` - Lihat saldo semua kantong
• \`tambah kantong BCA 5000000\` - Buat kantong baru
• \`transfer 500k dari bca ke gopay\` - Transfer antar kantong
• Catat + potong saldo: \`beli makan 20k dari gopay\`

━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 *FORMAT JUMLAH:*
• 50k = Rp 50.000
• 1.5jt = Rp 1.500.000
• 500rb = Rp 500.000
• 25000 = Rp 25.000

━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 *MULTI-TRANSAKSI:*
Kirim beberapa transaksi sekaligus dalam satu pesan!
Pisahkan dengan enter/newline:

\`keluar 18k beli sabun @pribadi
keluar 50k makan siang @makan
masuk 100k uang jajan @bonus\`

🤖 Atau kirim pesan biasa, AI akan otomatis mendeteksi transaksi!

🌐 Dashboard: gotek.vercel.app`;

      return NextResponse.json({ message: detailedHelp });
    }


    const helpMessage = `🤖 *GoTEK Bot - Panduan Singkat*
━━━━━━━━━━━━━━━━━

📝 *CATAT TRANSAKSI*
\`keluar 18k sabun @kebutuhan pribadi\`
\`masuk 5jt gaji @pekerjaan\`

📒 *HUTANG/PIUTANG*
\`hutang 100k @Budi modal\`
\`cek hutang\` | \`lunas @Budi\`

🎯 *BUDGET, LAPORAN & SALDO*
\`budget 1jt @makan\` | \`cek budget\`
\`laporan hari/minggu/bulan\` | \`cek saldo\`

👑 *PREMIUM*
\`kantong\` - Cek saldo bank & e-wallet
\`tambah kantong BCA 5jt\` - Buat kantong
\`transfer 500k dari bca ke gopay\`
\`upgrade\` - Info Premium

↩️ \`undo\` - Batalkan transaksi

━━━━━━━━━━━━━━━━━
💡 *TIPS:*
• Kategori bisa multi-kata
• Format: 50k, 1.5jt, 500rb
• Beli dari kantong: \`beli makan 20k dari gopay\`
• Ketik *penjelasan detail* untuk panduan lengkap

🌐 https://gotek.vercel.app`;

    return NextResponse.json({ message: helpMessage });

  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json(
      { message: "Maaf, terjadi kesalahan internal di server." },
      { status: 500 }
    );
  }
}
