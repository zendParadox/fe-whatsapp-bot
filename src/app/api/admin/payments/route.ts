import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdmin } from "@/lib/admin";

export async function GET(request: NextRequest) {
  const auth = await verifyAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "PENDING"; // default to pending
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Number(searchParams.get("limit")) || 20;
    const skip = (page - 1) * limit;

    const whereClause: any = {};
    if (status !== "ALL") {
      whereClause.status = status;
    }

    const [payments, total] = await Promise.all([
      prisma.manualPayment.findMany({
        where: whereClause,
        orderBy: { created_at: "desc" },
        skip,
        take: limit,
        include: {
          user: {
            select: { name: true, whatsapp_jid: true, email: true },
          },
        },
      }),
      prisma.manualPayment.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      payments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[Admin Payments GET]", error);
    return NextResponse.json({ error: "Gagal mengambil data pembayaran" }, { status: 500 });
  }
}
