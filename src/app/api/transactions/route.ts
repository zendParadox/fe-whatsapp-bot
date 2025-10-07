// src/app/api/transactions/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // sesuaikan path jika perlu
import type { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month");

  // gunakan tipe Prisma.TransactionWhereInput agar lebih aman (atau 'any' jika belum mau import type)
  let whereClause: Prisma.TransactionClient | Record<string, unknown> = {};

  if (month === "current" || month === "last") {
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    if (month === "current") {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      endDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    whereClause = {
      created_at: {
        gte: startDate,
        lt: endDate,
      },
    };
  }

  try {
    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      orderBy: {
        created_at: "desc",
      },
    });

    const serializedTransactions = transactions.map((tx) => {
      // tx.amount biasanya prisma Decimal. Gunakan toNumber jika ada, fallback ke Number/toString
      // This avoids losing precision unexpectedly; but for UI number display toNumber is fine.
      const amountAny: any = (tx as any).amount;
      let amountNumber: number;

      if (amountAny && typeof amountAny.toNumber === "function") {
        amountNumber = amountAny.toNumber();
      } else if (amountAny && typeof amountAny.toString === "function") {
        amountNumber = Number(amountAny.toString());
      } else {
        amountNumber = Number(amountAny);
      }

      return {
        ...tx,
        amount: amountNumber,
      };
    });

    return NextResponse.json({ transactions: serializedTransactions });
  } catch (error) {
    console.error("Failed to fetch transactions:", error);
    return NextResponse.json(
      { message: "Internal server error while fetching transactions." },
      { status: 500 }
    );
  }
}
