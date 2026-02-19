import { NextResponse, type NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { hashPassword } from "@/lib/auth";
import { normalizePhone, isAllowedPhone } from "@/lib/phone";

const prisma = new PrismaClient();

const resetPasswordSchema = z.object({
  phoneNumber: z.string().min(10, "Nomor WhatsApp tidak valid"),
  token: z.string().length(6, "Kode harus 6 digit"),
  newPassword: z.string().min(6, "Password minimal 6 karakter"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = resetPasswordSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { phoneNumber: rawPhone, token, newPassword } = validation.data;

    // Normalisasi nomor telepon
    const phoneNumber = normalizePhone(rawPhone);

    if (!isAllowedPhone(phoneNumber)) {
      return NextResponse.json(
        { error: "Hanya nomor Indonesia (62) dan Australia (61) yang didukung." },
        { status: 400 }
      );
    }

    // Cari user berdasarkan nomor WhatsApp
    const user = await prisma.user.findUnique({
      where: { whatsapp_jid: phoneNumber },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Nomor WhatsApp tidak terdaftar." },
        { status: 404 }
      );
    }

    // Cari token yang valid
    const resetToken = await prisma.resetPasswordToken.findFirst({
      where: {
        userId: user.id,
        token: token,
        expiresAt: { gt: new Date() }, // Belum expired
      },
    });

    if (!resetToken) {
      return NextResponse.json(
        { error: "Kode tidak valid atau sudah expired. Silakan minta kode baru." },
        { status: 400 }
      );
    }

    // Hash password baru
    const hashedPassword = hashPassword(newPassword);

    // Update password user
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    // Hapus token yang sudah digunakan
    await prisma.resetPasswordToken.delete({
      where: { id: resetToken.id },
    });

    // Hapus semua token lain untuk user ini (jika ada)
    await prisma.resetPasswordToken.deleteMany({
      where: { userId: user.id },
    });

    return NextResponse.json({
      message: "Password berhasil diubah. Silakan login dengan password baru.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server. Coba lagi nanti." },
      { status: 500 }
    );
  }
}
