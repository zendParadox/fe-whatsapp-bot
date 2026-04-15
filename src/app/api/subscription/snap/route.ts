import { NextResponse } from "next/server";
import { snap } from "@/lib/midtrans";
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
    case 1:
      return 15000;
    case 3:
      return 39000;
    case 6:
      return 66000;
    case 12:
      return 108000;
    default:
      return 15000 * months;
  }
}

/**
 * POST /api/subscription/snap
 *
 * Membuat transaksi via Midtrans Snap API.
 * Body: { months: number }
 * Returns: { token, redirect_url, order_id }
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
    const orderId = `SNAP-${Date.now()}-${crypto.randomUUID().substring(0, 8)}`;

    // Midtrans Snap API — Create transaction
    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: amount,
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
      // Mengaktifkan fitur Snap tertentu jika perlu, tapi biarkan default untuk mendukung semua (termasuk QRIS)
      // enabled_payments: ["credit_card", "gopay", "shopeepay", "qris", "bank_transfer"],
    };

    const transaction = await snap.createTransaction(parameter);
    const snapToken = transaction.token;
    const redirectUrl = transaction.redirect_url;

    if (!snapToken) {
      console.error("Midtrans Snap response:", JSON.stringify(transaction));
      throw new Error("Failed to get snap token from Midtrans");
    }

    // Save to Subscription table
    await prisma.subscription.create({
      data: {
        user_id: user.id,
        order_id: orderId,
        amount: amount,
        months: months,
        status: "pending",
        payment_type: "snap",
        midtrans_url: redirectUrl,
      },
    });

    return NextResponse.json({
      success: true,
      token: snapToken,
      redirect_url: redirectUrl,
      order_id: orderId,
      amount: amount,
      months: months,
    });
  } catch (error: unknown) {
    console.error("Snap Charge Error:", error);
    return NextResponse.json(
      {
        error: "Gagal membuat transaksi Snap. Silakan coba lagi.",
        details: error instanceof Error ? error.message : String(error),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        api_response: (error as any)?.ApiResponse,
      },
      { status: 500 },
    );
  }
}
