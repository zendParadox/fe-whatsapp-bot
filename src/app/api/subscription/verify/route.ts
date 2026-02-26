import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { coreApi } from "@/lib/midtrans";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";

const prisma = new PrismaClient();

/**
 * GET /api/subscription/verify?order_id=SUB-xxx
 * 
 * Endpoint polling: Frontend memanggil ini setelah user kembali dari halaman Midtrans.
 * Endpoint ini mengecek langsung ke Midtrans API untuk status terbaru,
 * lalu meng-update database jika pembayaran sudah settlement.
 */
export async function GET(request: Request) {
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

    const userId = payload.userId as string;

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("order_id");

    if (!orderId) {
      return NextResponse.json({ error: "order_id is required" }, { status: 400 });
    }

    // Pastikan subscription milik user ini
    const sub = await prisma.subscription.findUnique({
      where: { order_id: orderId },
      include: { user: true },
    });

    if (!sub || sub.user_id !== userId) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }

    // Jika sudah settlement di DB, langsung return
    if (sub.status === "settlement") {
      return NextResponse.json({
        status: "settlement",
        plan_type: "PREMIUM",
        message: "Pembayaran sudah berhasil sebelumnya.",
      });
    }

    // Cek langsung ke Midtrans API
    let midtransStatus: string;
    let paymentType: string | undefined;

    try {
      const statusResponse = await coreApi.transaction.status(orderId);
      midtransStatus = statusResponse.transaction_status;
      paymentType = statusResponse.payment_type;
    } catch (mtError: unknown) {
      console.error("Midtrans status check error:", mtError);
      return NextResponse.json({
        status: sub.status,
        plan_type: sub.user.plan_type || "FREE",
        message: "Belum bisa memverifikasi ke Midtrans. Coba lagi nanti.",
      });
    }

    // Proses berdasarkan status dari Midtrans
    if (midtransStatus === "capture" || midtransStatus === "settlement") {
      // 1. Update subscription
      await prisma.subscription.update({
        where: { order_id: orderId },
        data: {
          status: "settlement",
          payment_type: paymentType,
        },
      });

      // 2. Upgrade user ke PREMIUM
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + 30);

      await prisma.user.update({
        where: { id: sub.user_id },
        data: {
          plan_type: "PREMIUM",
          premium_valid_until: validUntil,
        },
      });

      return NextResponse.json({
        status: "settlement",
        plan_type: "PREMIUM",
        valid_until: validUntil.toISOString(),
        message: "🎉 Pembayaran berhasil! Akun Anda sekarang Premium.",
      });
    } else if (midtransStatus === "pending") {
      return NextResponse.json({
        status: "pending",
        plan_type: "FREE",
        message: "Pembayaran masih menunggu konfirmasi.",
      });
    } else {
      // deny, cancel, expire
      await prisma.subscription.update({
        where: { order_id: orderId },
        data: { status: midtransStatus },
      });

      return NextResponse.json({
        status: midtransStatus,
        plan_type: "FREE",
        message: `Pembayaran ${midtransStatus}. Silakan coba lagi.`,
      });
    }
  } catch (error) {
    console.error("Subscription verify error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
