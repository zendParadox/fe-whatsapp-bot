import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload || !payload.userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { receiptBase64, amount, months = 1 } = await req.json();

    if (!receiptBase64 || !amount) {
      return NextResponse.json({ error: "Receipt image and amount are required" }, { status: 400 });
    }

    // Buat manual payment entry baru
    const manualPayment = await prisma.manualPayment.create({
      data: {
        user_id: payload.userId,
        amount: Number(amount),
        months: Number(months),
        receipt_image_url: receiptBase64, // Disimpan sebagai Base64 untuk mempermudah. Jika besar, mestinya ke S3/Supabase Storage.
        status: "PENDING",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Bukti pembayaran berhasil diunggah. Menunggu verifikasi admin.",
      payment_id: manualPayment.id,
    });
  } catch (error) {
    console.error("[Manual Payment Error]:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat memproses pembayaran manual." },
      { status: 500 }
    );
  }
}
