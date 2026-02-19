import { NextResponse, type NextRequest } from "next/server";
import { PrismaClient, TransactionType } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { z } from "zod";
import { parseReceiptImage } from "@/lib/ai-provider";
import { checkBudgetStatus } from "@/lib/whatsapp/service";
import { normalizePhone, formatMoneyBot } from "@/lib/phone";

const prisma = new PrismaClient();

const imageWebhookSchema = z.object({
  sender: z.string(),
  image: z.string(), // base64 encoded image
  mimetype: z.string(),
  caption: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = imageWebhookSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { message: "❌ Payload tidak valid." },
        { status: 400 }
      );
    }

    const { sender, image, mimetype, caption } = validation.data;

    // === Normalize sender ===
    let rawSender = sender;
    if (rawSender.includes("@")) {
      rawSender = rawSender.split("@")[0];
    }
    if (rawSender.includes(":")) {
      rawSender = rawSender.split(":")[0];
    }
    rawSender = rawSender.replace(/\D/g, "");

    // LID detection - length-based only
    const isLid = rawSender.length > 15;

    let normalizedSender = rawSender;

    if (isLid) {
      const mapping = await prisma.lidMapping.findUnique({
        where: { lid: rawSender },
      });
      if (mapping) {
        normalizedSender = mapping.phone;
      } else {
        return NextResponse.json({
          message:
            '🔗 *Perangkat Tertaut Terdeteksi*\n\nAnda belum menghubungkan akun. Kirim nomor telepon Anda terlebih dahulu (tanpa gambar).\n\nContoh: `081234567890`',
        });
      }
    } else {
      normalizedSender = normalizePhone(normalizedSender);
    }

    // === Find user ===
    const user = await prisma.user.findUnique({
      where: { whatsapp_jid: normalizedSender },
    });

    if (!user) {
      return NextResponse.json({
        message:
          "❌ Nomor Anda belum terdaftar. Silakan daftar terlebih dahulu di https://gotek.vercel.app/register",
      });
    }

    // Currency-aware formatter
    const fmt = (amount: number) => formatMoneyBot(amount, user.currency);

    console.log(
      `📸 Receipt image received from ${normalizedSender} (${image.length} chars base64)`
    );

    // === Parse receipt with AI ===
    let parsedTransactions;
    try {
      parsedTransactions = await parseReceiptImage(image, mimetype, caption);
    } catch (error: unknown) {
      if (error instanceof Error && error.message === "GEMINI_RATE_LIMIT") {
        return NextResponse.json({
          message:
            "⚠️ *Limit AI Habis*\n\nMaaf, kuota penggunaan AI (Gemini) telah mencapai batas.\n\nSilakan coba lagi nanti atau catat manual:\n`keluar 50k makan siang @makan`",
        });
      }
      console.error("❌ Error parsing receipt image:", error);
      return NextResponse.json({
        message:
          "❌ *Gagal Memproses Struk*\n\nTerjadi kesalahan saat menganalisis gambar. Pastikan gambar struk jelas dan coba lagi.",
      });
    }

    if (!parsedTransactions || parsedTransactions.length === 0) {
      return NextResponse.json({
        message:
          "⚠️ *Struk Tidak Terdeteksi*\n\nGambar yang dikirim tidak terdeteksi sebagai struk belanja, atau struk tidak terbaca.\n\n💡 *Tips:*\n• Pastikan foto jelas dan tidak blur\n• Pastikan seluruh struk terlihat\n• Coba foto ulang dengan pencahayaan yang baik",
      });
    }

    // === Save transactions to database ===
    const results: { success: boolean; icon: string; text: string }[] = [];
    let totalExpense = 0;
    let totalIncome = 0;
    let successCount = 0;
    const budgetAlerts: string[] = [];

    for (const tx of parsedTransactions) {
      try {
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

        if (tx.type === "EXPENSE") {
          const alert = await checkBudgetStatus(
            user.id,
            category.id,
            tx.amount,
            user.currency
          );
          if (alert) budgetAlerts.push(`${category.name}: ${alert}`);
          totalExpense += tx.amount;
        } else {
          totalIncome += tx.amount;
        }

        const typeEnum =
          tx.type === "INCOME"
            ? TransactionType.INCOME
            : TransactionType.EXPENSE;

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
        const formattedAmt = fmt(tx.amount);
        results.push({
          success: true,
          icon,
          text: `${formattedAmt} - ${tx.description} (${category.name})`,
        });
        successCount++;
      } catch (err) {
        console.error("Transaction save error:", err);
        results.push({
          success: false,
          icon: "❌",
          text: `"${tx.description}" - Gagal disimpan`,
        });
      }
    }

    // === Build response ===
    const dateStr = new Date().toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });

    let reply = `🧾 *Struk Berhasil Diproses!*\n`;
    reply += `📅 ${dateStr}\n`;
    reply += `━━━━━━━━━━━━━━━━━\n\n`;

    results.forEach((r) => {
      reply += `${r.icon} ${r.text}\n`;
    });

    reply += `\n━━━━━━━━━━━━━━━━━\n`;
    reply += `📊 *Ringkasan:*\n`;
    reply += `✅ Berhasil: ${successCount}/${parsedTransactions.length} item\n`;
    if (totalIncome > 0)
      reply += `📈 Total Masuk: ${fmt(totalIncome)}\n`;
    if (totalExpense > 0)
      reply += `📉 Total Keluar: ${fmt(totalExpense)}\n`;

    if (budgetAlerts.length > 0) {
      reply += `\n⚠️ *Peringatan Budget:*\n${budgetAlerts.join("\n")}`;
    }

    reply += `\n\n💡 _Ketik "laporan hari" untuk lihat ringkasan hari ini_`;

    return NextResponse.json({ message: reply });
  } catch (error) {
    console.error("❌ Image webhook error:", error);
    return NextResponse.json(
      { message: "❌ Terjadi kesalahan server." },
      { status: 500 }
    );
  }
}
