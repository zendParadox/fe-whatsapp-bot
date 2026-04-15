import { NextResponse } from "next/server";
import { coreApi } from "@/lib/midtrans";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

/**
 * Harga langganan berdasarkan durasi (bulan).
 * Semakin lama, semakin hemat per bulan.
 */
function getDurationPrice(months: number): number {
  switch (months) {
    case 1: return 15000;
    case 3: return 39000;
    case 6: return 66000;
    case 12: return 108000;
    default: return 15000 * months;
  }
}

/**
 * POST /api/subscription/qris
 * 
 * Membuat transaksi Dynamic QRIS via Midtrans Core API.
 * Body: { months: number }
 * Returns: { qr_url, qr_string, order_id, amount, expiry_time }
 */
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

    const userId = payload.userId as string;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await req.json();
    const months = Number(body.months) || 1;

    if (![1, 3, 6, 12].includes(months)) {
      return NextResponse.json({ error: "Invalid duration" }, { status: 400 });
    }

    const amount = getDurationPrice(months);
    const orderId = `QRIS-${Date.now()}-${crypto.randomUUID().substring(0, 8)}`;

    // Midtrans Core API — Dynamic QRIS charge
    const parameter = {
      payment_type: "qris",
      transaction_details: {
        order_id: orderId,
        gross_amount: amount,
      },
      qris: {
        acquirer: "gopay",
      },
      customer_details: {
        first_name: user.name || "GoTEK",
        last_name: "User",
        email: user.email,
        phone: user.whatsapp_jid?.replace("@s.whatsapp.net", "") || "",
      },
      item_details: [
        {
          id: `PREMIUM-${months}M`,
          price: amount,
          quantity: 1,
          name: `GoTEK Premium - ${months} Bulan`,
        },
      ],
      custom_expiry: {
        expiry_duration: 15,
        unit: "minute",
      },
    };

    const chargeResponse = await coreApi.charge(parameter);

    // Extract QR code URL from response actions
    let qrUrl = "";
    const qrString = chargeResponse.qr_string || "";

    if (chargeResponse.actions && Array.isArray(chargeResponse.actions)) {
      const qrAction = chargeResponse.actions.find(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (a: any) => a.name === "generate-qr-code"
      );
      if (qrAction) {
        qrUrl = qrAction.url;
      }
    }

    if (!qrUrl && !qrString) {
      console.error("Midtrans QRIS response:", JSON.stringify(chargeResponse));
      throw new Error("Failed to get QR code from Midtrans");
    }

    // Calculate expiry time (15 minutes from now)
    const expiryTime = new Date();
    expiryTime.setMinutes(expiryTime.getMinutes() + 15);

    // Save to Subscription table
    await prisma.subscription.create({
      data: {
        user_id: user.id,
        order_id: orderId,
        amount: amount,
        months: months,
        status: "pending",
        payment_type: "qris",
        qr_url: qrUrl,
      },
    });

    return NextResponse.json({
      success: true,
      qr_url: qrUrl,
      qr_string: qrString,
      order_id: orderId,
      amount: amount,
      months: months,
      expiry_time: expiryTime.toISOString(),
    });
  } catch (error: unknown) {
    console.error("QRIS Charge Error:", error);
    return NextResponse.json(
      { error: "Gagal membuat transaksi QRIS. Silakan coba lagi." },
      { status: 500 }
    );
  }
}
