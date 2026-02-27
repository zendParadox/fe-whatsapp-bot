import { NextResponse, type NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";
import { snap } from "@/lib/midtrans";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";
import crypto from "crypto";

const prisma = new PrismaClient();

const SUBSCRIPTION_PRICE = 15000;

export async function POST(req: NextRequest) {
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

    // Generate unique order ID
    const orderId = `SUB-${Date.now()}-${crypto.randomUUID().substring(0, 8)}`;

    const transactionDetails = {
      order_id: orderId,
      gross_amount: SUBSCRIPTION_PRICE,
    };

    const customerDetails = {
      first_name: user.name || "GoTEK",
      last_name: "User",
      email: user.email,
      phone: user.whatsapp_jid?.replace("@s.whatsapp.net", "") || "",
    };

    const itemDetails = [
      {
        id: "PREMIUM-MONTHLY",
        price: SUBSCRIPTION_PRICE,
        quantity: 1,
        name: "GoTEK Premium - 1 Bulan",
      },
    ];

    const parameter = {
      transaction_details: transactionDetails,
      customer_details: customerDetails,
      item_details: itemDetails,
      credit_card: {
        secure: true,
      },
    };

    // Creates Snap transaction
    const transaction = await snap.createTransaction(parameter);

    if (!transaction.redirect_url) {
      throw new Error("Failed to get redirect URL from Midtrans");
    }

    // Save strictly to DB in 'pending' status
    const newSub = await prisma.subscription.create({
      data: {
        user_id: user.id,
        order_id: orderId,
        amount: SUBSCRIPTION_PRICE,
        status: "pending",
        midtrans_url: transaction.redirect_url,
      },
    });

    return NextResponse.json({
      success: true,
      redirect_url: transaction.redirect_url,
      order_id: orderId,
      subscription: newSub,
    });
  } catch (error: unknown) {
    console.error("Midtrans transaction error:", error);
    return NextResponse.json(
      { error: "Failed to create subscription order" },
      { status: 500 }
    );
  }
}
