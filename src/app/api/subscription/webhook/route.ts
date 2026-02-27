import { NextResponse, type NextRequest } from "next/server";
import { PrismaClient, PlanType } from "@prisma/client";
import { coreApi } from "@/lib/midtrans";
import crypto from "crypto";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Webhook notification payload properties from Midtrans
    const { order_id, status_code, gross_amount, signature_key, transaction_status, payment_type } = body;

    if (!order_id || !signature_key) {
      return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
    }

    // Verify signature to ensure notification is genuine
    const serverKey = process.env.MIDTRANS_SERVER_KEY || "";
    const hash = crypto.createHash("sha512");
    hash.update(`${order_id}${status_code}${gross_amount}${serverKey}`);
    const generatedSignature = hash.digest("hex");

    if (generatedSignature !== signature_key) {
      return NextResponse.json({ message: "Invalid signature" }, { status: 403 });
    }

    // Optional: Double check to Midtrans API to be absolutely sure
    const statusResponse = await coreApi.transaction.status(order_id);
    const validStatus = statusResponse.transaction_status;

    const sub = await prisma.subscription.findUnique({
      where: { order_id },
      include: { user: true }
    });

    if (!sub) {
      return NextResponse.json({ message: "Subscription not found" }, { status: 404 });
    }

    // Process status update based on Midtrans transaction_status
    if (validStatus === 'capture' || validStatus === 'settlement') {
      // 1. Update subscription status
      await prisma.subscription.update({
        where: { order_id },
        data: { 
          status: 'settlement',
          payment_type: payment_type
        }
      });

      // 2. Set user as PREMIUM and set valid_until to 30 days from now
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + 30); // Valid for 30 days

      await prisma.user.update({
        where: { id: sub.user_id },
        data: {
          plan_type: PlanType.PREMIUM,
          premium_valid_until: validUntil
        }
      });

      // 3. Send WhatsApp notification
      if (sub.user.whatsapp_jid) {
        const msg = `🎉 *PEMBAYARAN BERHASIL!*\n\nSelamat, akun GoTEK Anda kini telah diupgrade ke *Premium*!\nNikmati akses unlimited ke Smart AI Parser dan wawasan finansial otomatis dari kami.\n\nBerlaku hingga: ${validUntil.toLocaleDateString('id-ID')}`;
        console.log("MENSIMULASIKAN KIRIM WA KE:", sub.user.whatsapp_jid, msg);
      }

    } else if (validStatus === 'deny' || validStatus === 'cancel' || validStatus === 'expire') {
      await prisma.subscription.update({
        where: { order_id },
        data: { status: validStatus }
      });
    }

    return NextResponse.json({ message: "OK" });

  } catch (error) {
    console.error("Midtrans Webhook Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
