import { NextResponse, type NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import crypto from "crypto";

const prisma = new PrismaClient();

const forgotPasswordSchema = z.object({
  phoneNumber: z.string().min(10, "Nomor WhatsApp tidak valid"),
});

// Golang bot endpoint untuk mengirim pesan
const GOLANG_BOT_URL = process.env.GOLANG_BOT_URL || "https://bot.rafliramadhani.site";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = forgotPasswordSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    let { phoneNumber } = validation.data;

    // Normalisasi nomor telepon
    phoneNumber = phoneNumber.replace(/\D/g, "");
    if (phoneNumber.startsWith("0")) {
      phoneNumber = "62" + phoneNumber.substring(1);
    }
    if (!phoneNumber.startsWith("62")) {
      phoneNumber = "62" + phoneNumber;
    }

    // Cari user berdasarkan nomor WhatsApp
    const user = await prisma.user.findUnique({
      where: { whatsapp_jid: phoneNumber },
    });

    if (!user) {
      // Untuk keamanan, jangan beri tahu bahwa nomor tidak terdaftar
      // Tapi berikan respons sukses agar attacker tidak bisa enumerate users
      return NextResponse.json({
        message: "Jika nomor terdaftar, kode reset akan dikirim via WhatsApp.",
      });
    }

    // Hapus token lama yang belum expired untuk user ini
    await prisma.resetPasswordToken.deleteMany({
      where: { userId: user.id },
    });

    // Generate 6-digit token
    const token = crypto.randomInt(100000, 999999).toString();

    // Token berlaku 15 menit
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // Simpan token ke database
    await prisma.resetPasswordToken.create({
      data: {
        token,
        expiresAt,
        userId: user.id,
      },
    });

    // Kirim kode via WhatsApp Bot
    const whatsappMessage = `🔐 *Reset Password GoTEK*\n\nKode verifikasi Anda: *${token}*\n\nKode ini berlaku selama 15 menit.\n\n⚠️ Jangan bagikan kode ini kepada siapa pun.`;

    try {
      const response = await fetch(`${GOLANG_BOT_URL}/send-message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phoneNumber,
          message: whatsappMessage,
        }),
      });

      if (!response.ok) {
        console.error("Failed to send WhatsApp message:", await response.text());
        // Jangan gagalkan request, token sudah tersimpan
        // User bisa coba resend atau hubungi support
      }
    } catch (botError) {
      console.error("Error connecting to WhatsApp bot:", botError);
      // Token sudah tersimpan, tapi pesan gagal dikirim
      // Dalam development, log token untuk testing
      if (process.env.NODE_ENV === "development") {
        console.log(`[DEV] Reset token for ${phoneNumber}: ${token}`);
      }
    }

    return NextResponse.json({
      message: "Kode reset password telah dikirim ke WhatsApp Anda.",
      // Kirim phoneNumber kembali untuk redirect ke halaman reset
      phoneNumber,
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server. Coba lagi nanti." },
      { status: 500 }
    );
  }
}
