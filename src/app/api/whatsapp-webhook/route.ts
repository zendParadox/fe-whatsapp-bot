import { NextResponse, type NextRequest } from "next/server";
import {
  PrismaClient,
  TransactionType,
  DebtType,
  DebtStatus
} from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { z } from "zod";
import { parseTransactionFromText } from "@/lib/gemini";

import { parseSmartAmount, parseTransactionMessage, parseDebtMessage } from "@/lib/whatsapp/parser";
import { checkBudgetStatus } from "@/lib/whatsapp/service";

const prisma = new PrismaClient();

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

    // Deteksi apakah ini LID (Linked ID) - LID biasanya > 15 digit dan tidak dimulai dengan 62/08
    const isLid = rawSender.length > 15 || (!rawSender.startsWith("62") && !rawSender.startsWith("0") && rawSender.length > 10);
    
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
        
        // Jika pesan berupa nomor telepon (format: 08xxx atau 62xxx atau +62xxx)
        const phoneRegex = /^(\+?62|0)[0-9]{8,12}$/;
        if (phoneRegex.test(trimmedMessage.replace(/[\s-]/g, ""))) {
          // User mengirim nomor telepon - simpan mapping
          let phoneToSave = trimmedMessage.replace(/[\s\-\+]/g, "");
          if (phoneToSave.startsWith("0")) {
            phoneToSave = "62" + phoneToSave.substring(1);
          }
          if (!phoneToSave.startsWith("62")) {
            phoneToSave = "62" + phoneToSave;
          }

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
      if (normalizedSender.startsWith("0")) {
        normalizedSender = "62" + normalizedSender.substring(1);
      }
      if (!normalizedSender.startsWith("62") && normalizedSender.length >= 9) {
        normalizedSender = "62" + normalizedSender;
      }
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

    // Update LID mapping dengan user_id jika belum ada
    if (lidValue) {
      await prisma.lidMapping.updateMany({
        where: { lid: lidValue, user_id: null },
        data: { user_id: user.id }
      });
    }

    const args = message.trim().split(" ");
    const command = args[0].toLowerCase();


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


    
    const aiTransactions = await parseTransactionFromText(message);

    if (aiTransactions && aiTransactions.length > 0) {
      let reply = "✨ *Sistem AI (Gemini)*\n";
      let count = 0;

      for (const tx of aiTransactions) {
        
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
