// app/api/whatsapp-webhook/route.ts

import { NextResponse } from "next/server";
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Mem-parsing pesan transaksi dari format teks.
 * Contoh: "keluar 50000 makanan ringan"
 * "masuk 1000000 gaji bulanan"
 * @param message Pesan teks yang akan di-parse.
 * @returns Objek transaksi yang sudah di-parse atau null jika format salah.
 */
function parseTransactionMessage(message: string): {
  type: "INCOME" | "EXPENSE";
  amount: number;
  category: string;
  description: string | null;
} | null {
  // Menghapus spasi berlebih dan mengubah ke huruf kecil
  const parts = message.trim().toLowerCase().split(/\s+/);

  // Pesan harus memiliki minimal 3 bagian: [tipe] [jumlah] [kategori]
  if (parts.length < 3) {
    return null;
  }

  const [typeStr, amountStr, category, ...descriptionParts] = parts;

  let type: "INCOME" | "EXPENSE";
  if (typeStr === "masuk") {
    type = "INCOME";
  } else if (typeStr === "keluar") {
    type = "EXPENSE";
  } else {
    // Tipe tidak valid
    return null;
  }

  // Mengonversi jumlah menjadi angka, pastikan tidak ada format seperti "50k" atau "50.000"
  const amount = parseInt(amountStr.replace(/[^0-9]/g, ""), 10);
  if (isNaN(amount) || amount <= 0) {
    return null;
  }

  const description =
    descriptionParts.length > 0 ? descriptionParts.join(" ") : null;

  return { type, amount, category, description };
}

export async function POST(request: Request) {
  try {
    // 1. Dapatkan body dari request
    const body = await request.json();
    const { sender, message } = body;

    // 2. Validasi input dasar
    if (!sender || !message) {
      return NextResponse.json(
        { message: "Bad Request: `sender` and `message` are required." },
        { status: 400 }
      );
    }

    // 3. Parse pesan transaksi
    const parsedData = parseTransactionMessage(message);

    // 4. Jika format pesan salah, kirim balasan error
    if (!parsedData) {
      const replyMessage =
        "❌ Format salah. Gunakan: `keluar` atau `masuk` [jumlah] [kategori] [deskripsi opsional]";
      console.log(`Mengirim balasan ke ${sender}: ${replyMessage}`);
      // Di aplikasi nyata, respons ini akan dikirim kembali ke WhatsApp via service lain.
      return NextResponse.json({ message: replyMessage }, { status: 200 });
    }

    // 5. Coba simpan transaksi ke database
    try {
      // TODO: Anda harus mencari user ID yang sebenarnya berdasarkan `sender` (nomor telepon).
      // const user = await prisma.user.findUnique({ where: { phone: sender } });
      // if (!user) { ... handle user not found ... }

      await prisma.transaction.create({
        data: {
          type: parsedData.type,
          amount: parsedData.amount,
          category: parsedData.category,
          description: parsedData.description,
          user_id: sender, // GANTI INI dengan ID user yang sebenarnya, bukan nomor telepon
        },
      });

      const replyMessage = `✅ Transaksi '${
        parsedData.category
      }' sebesar Rp${parsedData.amount.toLocaleString(
        "id-ID"
      )} berhasil dicatat.`;
      console.log(`Mengirim balasan ke ${sender}: ${replyMessage}`);
      return NextResponse.json({ message: replyMessage }, { status: 200 });
    } catch (e) {
      console.error("Database Error:", e);
      // Tangani error spesifik dari Prisma
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        const replyMessage =
          "❌ Terjadi kesalahan saat menyimpan data ke database. Coba lagi.";
        return NextResponse.json({ message: replyMessage }, { status: 500 });
      }
      // Tangani error umum lainnya
      const replyMessage = "❌ Terjadi kesalahan internal pada server.";
      return NextResponse.json({ message: replyMessage }, { status: 500 });
    }
  } catch (error) {
    // Error jika body JSON tidak valid atau kesalahan tak terduga lainnya
    console.error("General Error:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
