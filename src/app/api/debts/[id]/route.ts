import { NextResponse, type NextRequest } from "next/server";

import { verifyToken } from "@/lib/auth";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

// Schema validasi untuk update
const updateDebtSchema = z.object({
  amount: z.number().positive("Jumlah harus lebih dari 0").optional(),
  type: z.enum(["HUTANG", "PIUTANG"]).optional(),
  status: z.enum(["UNPAID", "PAID"]).optional(),
  person_name: z.string().min(1, "Nama orang wajib diisi").optional(),
  description: z.string().optional(),
  due_date: z.string().nullable().optional(),
  repayment_wallet_id: z.string().nullable().optional(),
});

// GET: Ambil detail satu hutang/piutang
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload || !payload.userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { id } = await params;

    const debt = await prisma.debt.findFirst({
      where: {
        id,
        user_id: payload.userId,
      },
    });

    if (!debt) {
      return NextResponse.json({ error: "Data tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json(debt);
  } catch (error) {
    console.error("GET /api/debts/[id] error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

// PUT: Update hutang/piutang (termasuk mark as paid)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload || !payload.userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validation = updateDebtSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    // Check ownership
    const existing = await prisma.debt.findFirst({
      where: { id, user_id: payload.userId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Data tidak ditemukan" }, { status: 404 });
    }

    const { amount, type, status, person_name, description, due_date, repayment_wallet_id } = validation.data;

    // Check if status changed to PAID and we need to update wallet balances
    if (status === "PAID" && existing.status === "UNPAID") {
      // Determine which wallet gets updated: target repayment wallet OR the original debt wallet
      const targetWalletId = repayment_wallet_id || (existing as Record<string, unknown>).wallet_id as string | null;
      
      if (targetWalletId) {
        const user = await prisma.user.findUnique({
          where: { id: payload.userId },
          select: { plan_type: true }
        });
        
        if (user?.plan_type === "PREMIUM") {
          const wallet = await prisma.wallet.findFirst({
            where: { id: targetWalletId, user_id: payload.userId }
          });
          
          if (wallet) {
            // REPAYMENT LOGIC:
            // HUTANG (we borrowed before, now we repay) -> balance decreases
            // PIUTANG (we lent before, now we get paid back) -> balance increases
            const finalType = type || existing.type;
            const finalAmount = amount || Number(existing.amount);
            
            await prisma.wallet.update({
              where: { id: wallet.id },
              data: {
                balance: {
                  [finalType === "HUTANG" ? "decrement" : "increment"]: finalAmount
                }
              }
            });
          }
        }
      }
    }

    const updated = await prisma.debt.update({
      where: { id },
      data: {
        ...(amount !== undefined && { amount }),
        ...(type !== undefined && { type }),
        ...(status !== undefined && { status }),
        ...(person_name !== undefined && { person_name }),
        ...(description !== undefined && { description }),
        ...(due_date !== undefined && { due_date: due_date ? new Date(due_date) : null }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT /api/debts/[id] error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

// DELETE: Hapus hutang/piutang
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload || !payload.userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { id } = await params;

    // Check ownership
    const existing = await prisma.debt.findFirst({
      where: { id, user_id: payload.userId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Data tidak ditemukan" }, { status: 404 });
    }

    // Revert Wallet Balance if UNPAID
    // If it was PAID, it already affected the repayment wallet, so we don't automatically revert here (complex edge case).
    if ((existing as Record<string, unknown>).wallet_id && existing.status === "UNPAID") {
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { plan_type: true }
      });
      
      if (user?.plan_type === "PREMIUM") {
        const amountNum = Number(existing.amount);
        // REVERT logic: reverse what happened during POST
        // Original HUTANG (borrowed) added -> Revert by subtracting
        // Original PIUTANG (lent) subtracted -> Revert by adding
        await prisma.wallet.update({
          where: { id: (existing as Record<string, unknown>).wallet_id as string },
          data: {
            balance: {
              [existing.type === "HUTANG" ? "decrement" : "increment"]: amountNum
            }
          }
        });
      }
    }

    await prisma.debt.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/debts/[id] error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
