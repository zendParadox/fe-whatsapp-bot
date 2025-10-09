// file: src/app/api/whatsapp-webhook/route.ts

import { NextResponse, type NextRequest } from "next/server";
import {
  PrismaClient,
  TransactionType,
  PaymentMethodType,
} from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { z } from "zod";

const prisma = new PrismaClient();

const webhookPayloadSchema = z.object({
  sender: z.string(),
  message: z.string(),
});

/**
 * Parses a WhatsApp message to extract transaction details.
 * @param message The raw message string from the user.
 * @returns An object with transaction data or null if format is invalid.
 */
function parseTransactionMessage(message: string) {
  const parts = message.trim().split(" ");
  if (parts.length < 2) return null;

  const command = parts[0].toLowerCase();
  const amount = parseFloat(parts[1]);

  if (isNaN(amount) || amount <= 0) return null;

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

  const descWithoutExtras = message
    .replace(command, "")
    .replace(parts[1], "")
    .replace(/@\w+/, "")
    .replace(/#\w+/, "") // Also remove payment method from description
    .trim();

  const description = descWithoutExtras || "Transaksi WhatsApp";

  return { type, amount, description, category, paymentMethod };
}

/**
 * Parses a WhatsApp message to extract budget details.
 * @param message The raw message string from the user.
 * @returns An object with budget data or null if format is invalid.
 */
function parseBudgetMessage(message: string) {
  const parts = message.trim().split(" ");
  if (parts.length < 3) return null;

  const amount = parseFloat(parts[1]);
  if (isNaN(amount) || amount < 0) return null; // Budget can be 0

  const categoryMatch = message.match(/@(\w+)/);
  const category =
    categoryMatch && categoryMatch[1] ? categoryMatch[1].toLowerCase() : null;

  // Category is mandatory for a budget
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

    // --- Handle Transactions ---
    if (["masuk", "income", "keluar", "expense"].includes(command)) {
      const parsedData = parseTransactionMessage(message);

      if (!parsedData) {
        return NextResponse.json({
          message:
            "❌ Format transaksi salah.\n\nContoh:\n`keluar 50000 makan @makanan #cash`",
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
          payment_method:
            parsedData.type === "EXPENSE" ? parsedData.paymentMethod : null,
        },
      });

      const formattedAmount = `Rp ${parsedData.amount.toLocaleString("id-ID")}`;
      const typeText =
        parsedData.type === "INCOME" ? "Pemasukan" : "Pengeluaran";

      let replyMessage = `✅ Transaksi berhasil dicatat!\n\n*Tipe:* ${typeText}\n*Jumlah:* ${formattedAmount}\n*Kategori:* ${category.name}`;

      if (parsedData.type === "EXPENSE") {
        const paymentMethodText =
          parsedData.paymentMethod.charAt(0) +
          parsedData.paymentMethod.slice(1).toLowerCase().replace("_", " ");
        replyMessage += `\n*Metode:* ${paymentMethodText}`;
      }

      replyMessage += `\n*Deskripsi:* ${parsedData.description}`;

      return NextResponse.json({ message: replyMessage });
    }

    // --- Handle Budgets ---
    if (command === "budget" || command === "anggaran") {
      const parsedData = parseBudgetMessage(message);

      if (!parsedData) {
        return NextResponse.json({
          message:
            "❌ Format budget salah.\n\nContoh:\n`budget 500000 @makanan`",
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
      const currentMonth = now.getMonth() + 1; // JS months are 0-11
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

    // --- Handle Help Command ---
    if (command === "bantuan" || command === "help") {
      const helpMessage = `👋 Halo! Berikut daftar perintah yang bisa Anda gunakan:

*1. 📝 Mencatat Transaksi*
- Format: \`masuk/keluar <jumlah> [deskripsi] @<kategori> #<metode>\`
- Contoh: \`keluar 25000 kopi @minuman #gopay\`
- Metode pembayaran (cash, gopay, dll) bersifat opsional dan hanya untuk pengeluaran.

*2. 🎯 Mengatur Budget Bulanan*
- Format: \`budget <jumlah> @<kategori>\`
- Contoh: \`budget 750000 @transportasi\`
- Perintah ini akan mengatur/memperbarui budget untuk bulan berjalan.

*3. ❔ Bantuan*
- Format: \`bantuan\` atau \`help\`
- Untuk menampilkan pesan ini lagi.

Pastikan format penulisan benar agar tercatat dengan baik!`;

      return NextResponse.json({ message: helpMessage });
    }

    // --- Handle Unrecognized Commands ---
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
