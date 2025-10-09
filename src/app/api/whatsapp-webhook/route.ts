// file: app/api/whatsapp-webhook/route.ts

import { NextResponse, type NextRequest } from "next/server";
import { PrismaClient, TransactionType } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { z } from "zod";

const prisma = new PrismaClient();

const webhookPayloadSchema = z.object({
  sender: z.string(),
  message: z.string(),
});

// Fungsi parsing pesan WhatsApp untuk Transaksi
function parseTransactionMessage(message: string) {
  // ... (tidak ada perubahan di fungsi ini, biarkan seperti sebelumnya)
  const parts = message.trim().split(" ");
  if (parts.length < 2) return null;

  const command = parts[0].toLowerCase();
  const amount = parseFloat(parts[1]);

  if (isNaN(amount) || amount <= 0) return null;

  let type: TransactionType;
  if (command === "masuk" || command === "income") {
    type = TransactionType.INCOME;
  } else if (command === "keluar" || command === "expense") {
    type = TransactionType.EXPENSE;
  } else {
    return null;
  }

  const categoryMatch = message.match(/@(\w+)/);
  const category =
    categoryMatch && categoryMatch[1]
      ? categoryMatch[1].toLowerCase()
      : "lainnya";

  const descWithoutCommand = message
    .replace(command, "")
    .replace(parts[1], "")
    .replace(/@\w+/, "")
    .trim();

  const description = descWithoutCommand || "Transaksi WhatsApp";

  return { type, amount, description, category };
}

// Fungsi parsing pesan WhatsApp untuk Budget
function parseBudgetMessage(message: string) {
  // ... (tidak ada perubahan di fungsi ini, biarkan seperti sebelumnya)
  const parts = message.trim().split(" ");
  if (parts.length < 3) return null;

  const amount = parseFloat(parts[1]);
  if (isNaN(amount) || amount < 0) return null;

  const categoryMatch = message.match(/@(\w+)/);
  const category =
    categoryMatch && categoryMatch[1] ? categoryMatch[1].toLowerCase() : null;

  if (!category) return null;

  return { amount, category };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = webhookPayloadSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { message: "Payload tidak valid." },
        { status: 400 }
      );
    }

    const { sender, message } = validation.data;
    const user = await prisma.user.findUnique({
      where: { whatsapp_jid: sender },
    });

    if (!user) {
      return NextResponse.json({
        message:
          "❌ Nomor Anda tidak terdaftar. Silakan hubungkan akun Anda dari dashboard web.",
      });
    }

    const command = message.trim().split(" ")[0].toLowerCase();

    // --- Logika untuk Transaksi ---
    if (["masuk", "income", "keluar", "expense"].includes(command)) {
      // ... (tidak ada perubahan di blok ini)
      const parsedData = parseTransactionMessage(message);

      if (!parsedData) {
        return NextResponse.json({
          message:
            "❌ Format transaksi salah.\n\nContoh:\n*keluar 50000 makan siang @makanan*",
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

      await prisma.transaction.create({
        data: {
          type: parsedData.type,
          amount: new Decimal(parsedData.amount),
          description: parsedData.description,
          user_id: user.id,
          category_id: category.id,
        },
      });

      const formattedAmount = `Rp ${parsedData.amount.toLocaleString("id-ID")}`;
      const typeText =
        parsedData.type === "INCOME" ? "Pemasukan" : "Pengeluaran";
      const replyMessage = `✅ Transaksi berhasil dicatat!\n\n*Tipe:* ${typeText}\n*Jumlah:* ${formattedAmount}\n*Kategori:* ${category.name}\n*Deskripsi:* ${parsedData.description}`;

      return NextResponse.json({ message: replyMessage });
    }

    // --- Logika untuk Budget ---
    if (command === "budget" || command === "anggaran") {
      // ... (tidak ada perubahan di blok ini)
      const parsedData = parseBudgetMessage(message);

      if (!parsedData) {
        return NextResponse.json({
          message:
            "❌ Format budget salah.\n\nContoh:\n*budget 500000 @makanan*",
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
        update: {
          amount: new Decimal(parsedData.amount),
        },
        create: {
          user_id: user.id,
          category_id: category.id,
          amount: new Decimal(parsedData.amount),
          month: currentMonth,
          year: currentYear,
        },
      });

      const formattedAmount = `Rp ${parsedData.amount.toLocaleString("id-ID")}`;
      const monthName = now.toLocaleString("id-ID", { month: "long" });
      const replyMessage = `✅ Budget berhasil diatur!\n\n*Kategori:* ${category.name}\n*Jumlah:* ${formattedAmount}\n*Periode:* ${monthName} ${currentYear}`;

      return NextResponse.json({ message: replyMessage });
    }

    // --- BARU: Logika untuk Bantuan ---
    if (command === "bantuan" || command === "help") {
      const helpMessage = `👋 Halo! Berikut daftar perintah yang bisa Anda gunakan:

*1. 📝 Mencatat Transaksi*
- Format: \`masuk/keluar <jumlah> [deskripsi] @<kategori>\`
- Contoh: \`keluar 50000 makan siang @makanan\`
- Contoh: \`masuk 1000000 gaji bulanan @gaji\`

*2. 🎯 Mengatur Budget Bulanan*
- Format: \`budget <jumlah> @<kategori>\`
- Contoh: \`budget 750000 @transportasi\`
- Perintah ini akan mengatur budget untuk bulan berjalan.

*3. ❔ Bantuan*
- Format: \`bantuan\` atau \`help\`
- Untuk menampilkan pesan ini lagi.

Pastikan format penulisan benar agar transaksi dan budget Anda tercatat dengan baik!`;

      return NextResponse.json({ message: helpMessage });
    }

    // --- BARU: Balasan jika perintah tidak dikenali (diperbarui) ---
    return NextResponse.json({
      message:
        "❔ Perintah tidak dikenali.\n\nKetik *bantuan* atau *help* untuk melihat daftar perintah yang tersedia.",
    });
  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json(
      { message: "Maaf, terjadi kesalahan internal di server." },
      { status: 500 }
    );
  }
}
