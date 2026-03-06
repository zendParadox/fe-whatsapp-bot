import { NextResponse, type NextRequest } from "next/server";
import { DebtType, DebtStatus, Prisma } from "@prisma/client";
import { verifyToken } from "@/lib/auth";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

// Schema validasi
const createDebtSchema = z.object({
  amount: z.number().positive("Jumlah harus lebih dari 0"),
  type: z.enum(["HUTANG", "PIUTANG"]),
  person_name: z.string().min(1, "Nama orang wajib diisi"),
  description: z.string().optional(),
  due_date: z.string().optional(), // ISO date string
  wallet_id: z.string().nullable().optional(),
});

// GET: Ambil semua hutang/piutang user
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload || !payload.userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // UNPAID, PAID, or all
    const type = searchParams.get("type"); // HUTANG, PIUTANG, or all

    const where: Prisma.DebtWhereInput = { user_id: payload.userId };
    if (status && status !== "all") {
      where.status = status as DebtStatus;
    }
    if (type && type !== "all") {
      where.type = type as DebtType;
    }

    const debts = await prisma.debt.findMany({
      where,
      orderBy: [
        { status: "asc" }, // UNPAID first
        { due_date: "asc" }, // Soonest due date first
        { created_at: "desc" },
      ],
    });

    // Hitung summary
    const allDebts = await prisma.debt.findMany({
      where: { user_id: payload.userId, status: "UNPAID" },
    });

    const summary = {
      totalHutang: allDebts
        .filter((d) => d.type === "HUTANG")
        .reduce((sum, d) => sum + Number(d.amount), 0),
      totalPiutang: allDebts
        .filter((d) => d.type === "PIUTANG")
        .reduce((sum, d) => sum + Number(d.amount), 0),
      countHutang: allDebts.filter((d) => d.type === "HUTANG").length,
      countPiutang: allDebts.filter((d) => d.type === "PIUTANG").length,
    };

    return NextResponse.json({ debts, summary });
  } catch (error) {
    console.error("GET /api/debts error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

// POST: Buat hutang/piutang baru
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload || !payload.userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const body = await request.json();
    const validation = createDebtSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { amount, type, person_name, description, due_date, wallet_id } = validation.data;

    // Check user plan for premium features (wallet)
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { plan_type: true }
    });
    
    let finalWalletId = null;
    if (wallet_id && user?.plan_type === "PREMIUM") {
       const wallet = await prisma.wallet.findFirst({
         where: { id: wallet_id, user_id: payload.userId }
       });
       
       if (wallet) {
         finalWalletId = wallet.id;
         // Update wallet balance
         // HUTANG (we borrow money) -> balance increases
         // PIUTANG (we lend money) -> balance decreases
         await prisma.wallet.update({
           where: { id: wallet.id },
           data: {
             balance: {
               [type === "HUTANG" ? "increment" : "decrement"]: amount
             }
           }
         });
       }
    }

    const debt = await prisma.debt.create({
      data: {
        amount,
        type,
        person_name,
        description: description || null,
        wallet_id: finalWalletId,
        due_date: due_date ? new Date(due_date) : null,
        user_id: payload.userId,
      } as any,
    });

    return NextResponse.json(debt, { status: 201 });
  } catch (error) {
    console.error("POST /api/debts error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
