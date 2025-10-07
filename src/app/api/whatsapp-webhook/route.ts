// file: app/api/whatsapp-webhook/route.ts

import { NextResponse, type NextRequest } from "next/server";
import { PrismaClient, TransactionType } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { z } from "zod";

const prisma = new PrismaClient();

// Skema validasi untuk payload yang masuk dari bot Go
const webhookPayloadSchema = z.object({
  sender: z.string(),
  message: z.string(),
});

// Fungsi untuk mem-parsing pesan menjadi data transaksi
function parseTransactionMessage(message: string) {
  const parts = message.toLowerCase().split(" ");
  if (parts.length < 2) return null;

  const command = parts[0];
  const amount = parseFloat(parts[1]);
  const description =
    parts.length > 2
      ? message.split(" ").slice(2).join(" ")
      : "Transaksi WhatsApp";

  let type: TransactionType;

  if (command === "masuk" || command === "income") {
    type = TransactionType.INCOME;
  } else if (command === "keluar" || command === "expense") {
    type = TransactionType.EXPENSE;
  } else {
    return null; // Perintah tidak valid
  }

  if (isNaN(amount) || amount <= 0) {
    return null; // Jumlah tidak valid
  }

  return { type, amount, description };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 1. Validasi payload yang masuk
    const validation = webhookPayloadSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { message: "Payload tidak valid." },
        { status: 400 }
      );
    }
    const { sender, message } = validation.data;

    // 2. Cari pengguna berdasarkan JID WhatsApp
    const user = await prisma.user.findUnique({
      where: { whatsapp_jid: sender },
    });

    if (!user) {
      console.log(`Pengguna dengan JID ${sender} tidak ditemukan.`);
      return NextResponse.json({
        message:
          "❌ Nomor Anda tidak terdaftar di sistem. Silakan hubungkan akun Anda melalui dashboard web.",
      });
    }

    // 3. Parse pesan transaksi
    const parsedData = parseTransactionMessage(message);

    if (!parsedData) {
      return NextResponse.json({
        message:
          "❌ Format pesan salah. Contoh:\n\n*keluar 50000 makan siang*\natau\n*masuk 100000 bonus project*",
      });
    }

    // 4. Dapatkan atau buat kategori default
    // Di aplikasi nyata, Anda bisa membuat ini lebih cerdas
    let category = await prisma.category.findFirst({
      where: { user_id: user.id, name: "Lainnya" },
    });

    if (!category) {
      category = await prisma.category.create({
        data: { name: "Lainnya", user_id: user.id },
      });
    }

    // 5. Buat transaksi di database
    await prisma.transaction.create({
      data: {
        type: parsedData.type,
        amount: new Decimal(parsedData.amount),
        description: parsedData.description,
        user_id: user.id,
        category_id: category.id,
      },
    });

    // 6. Kirim pesan balasan sukses
    const formattedAmount = `Rp ${parsedData.amount.toLocaleString("id-ID")}`;
    const typeText = parsedData.type === "INCOME" ? "Pemasukan" : "Pengeluaran";

    const replyMessage = `✅ Transaksi berhasil dicatat!\n\n*Tipe:* ${typeText}\n*Jumlah:* ${formattedAmount}\n*Deskripsi:* ${parsedData.description}`;

    return NextResponse.json({ message: replyMessage });
  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json(
      { message: "Maaf, terjadi kesalahan internal di server." },
      { status: 500 }
    );
  }
}
