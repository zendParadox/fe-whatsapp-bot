import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdmin } from "@/lib/admin";
import { addMonths } from "date-fns";

const GOLANG_BOT_URL = process.env.GOLANG_BOT_URL || "https://bot.rafliramadhani.site";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const { id: paymentId } = await params;
    const { action, notes } = await request.json(); // action = "APPROVE" | "REJECT"

    if (action !== "APPROVE" && action !== "REJECT") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const payment = await prisma.manualPayment.findUnique({
      where: { id: paymentId },
      include: { user: true },
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }
    if (payment.status !== "PENDING") {
      return NextResponse.json({ error: "Payment is already processed" }, { status: 400 });
    }

    if (action === "APPROVE") {
      const addedMonths = payment.months || 1;
      const validUntil = payment.user.premium_valid_until && payment.user.premium_valid_until > new Date()
        ? addMonths(new Date(payment.user.premium_valid_until), addedMonths)
        : addMonths(new Date(), addedMonths);

      // Gunakan transaksi agar atomic
      await prisma.$transaction([
        prisma.manualPayment.update({
          where: { id: paymentId },
          data: { status: "APPROVED" },
        }),
        prisma.user.update({
          where: { id: payment.user_id },
          data: {
            plan_type: "PREMIUM",
            premium_valid_until: validUntil,
          },
        }),
        prisma.subscription.create({
          data: {
            user_id: payment.user_id,
            order_id: `MANUAL-${paymentId.substring(0, 8).toUpperCase()}`,
            amount: payment.amount,
            status: "settlement",
            payment_type: "bank_transfer_manual",
          },
        })
      ]);

      // Kirim Notifikasi via Bot Golang
      if (payment.user.whatsapp_jid) {
        let phone = payment.user.whatsapp_jid;
        if (!phone.endsWith("@s.whatsapp.net")) phone += "@s.whatsapp.net";

        const addedMonths = payment.months || 1;
        const msg = `🎉 *Luar Biasa! Pembayaran Berhasil!*\n\nStatus akun GoTEK Anda sekarang telah diupgrade menjadi *PREMIUM* selama *${addedMonths} Bulan* (hingga *${validUntil.toLocaleDateString("id-ID")}*).\n\nTerima kasih atas dukungan Anda! Fitur AI Parser & Unlimited Struk sekarang terbuka penuh untuk Anda.`;
        
        // Bypass TLS
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
        const botBaseUrl = GOLANG_BOT_URL.endsWith("/") ? GOLANG_BOT_URL.slice(0, -1) : GOLANG_BOT_URL;
        
        fetch(`${botBaseUrl}/send-message`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: phone, message: msg }),
        }).catch((err) => console.error("Gagal kirim notif WA approval:", err));
        
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = "1";
      }

    } else if (action === "REJECT") {
      await prisma.manualPayment.update({
        where: { id: paymentId },
        data: { status: "REJECTED", notes: notes || "Bukti transfer tidak valid/dana belum masuk." },
      });

      // Kirim Notifikasi Tolak
      if (payment.user.whatsapp_jid) {
        let phone = payment.user.whatsapp_jid;
        if (!phone.endsWith("@s.whatsapp.net")) phone += "@s.whatsapp.net";

        const msg = `⚠️ *Pemberitahuan Pembayaran GoTEK*\n\nMohon maaf, bukti pembayaran manual Anda *sebesar Rp ${payment.amount.toLocaleString()}* kami tolak.\n\n*Alasan:* ${notes || "Bukti transfer tidak valid atau dana belum divalidasi mutasi."}\n\nSilakan coba lagi dari Dashboard atau hubungi admin jika ini adalah kesalahan.`;
        
        // Bypass TLS
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
        const botBaseUrl = GOLANG_BOT_URL.endsWith("/") ? GOLANG_BOT_URL.slice(0, -1) : GOLANG_BOT_URL;
        fetch(`${botBaseUrl}/send-message`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: phone, message: msg }),
        }).catch((err) => console.error("Gagal kirim notif WA reject:", err));
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = "1";
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Admin Payments PUT]", error);
    return NextResponse.json({ error: "Gagal memproses pembayaran" }, { status: 500 });
  }
}
