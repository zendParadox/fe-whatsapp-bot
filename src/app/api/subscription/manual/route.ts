import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, ADMIN_PHONE } from "@/lib/auth";
import { cookies } from "next/headers";

const GOLANG_BOT_URL = process.env.GOLANG_BOT_URL || "https://bot.rafliramadhani.site";

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

    // Kirim notifikasi ke Admin via Bot WhatsApp
    (async () => {
      try {
        const adminPhone = ADMIN_PHONE.endsWith("@s.whatsapp.net") ? ADMIN_PHONE : `${ADMIN_PHONE}@s.whatsapp.net`;
        const botBaseUrl = GOLANG_BOT_URL.endsWith("/") ? GOLANG_BOT_URL.slice(0, -1) : GOLANG_BOT_URL;
        
        const notifyMsg = `🔔 *INFO PEMBAYARAN BARU* 🔔\n\nTerdapat pengajuan pembayaran manual baru sebesar *Rp ${Number(amount).toLocaleString("id-ID")}* untuk *${months} Bulan* Premium.\n\nSilakan cek halaman Dashboard Admin untuk melakukan verifikasi (Approve/Reject).\n🌐 https://gotek.vercel.app/admin/payments`;

        process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
        await fetch(`${botBaseUrl}/send-message`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: adminPhone, message: notifyMsg }),
        });
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = "1";
      } catch (err) {
        console.error("Gagal mengirim notif admin:", err);
      }
    })();

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
