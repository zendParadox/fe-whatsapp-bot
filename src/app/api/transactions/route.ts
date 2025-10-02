import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month");

  let whereClause = {};

  if (month === "current" || month === "last") {
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    if (month === "current") {
      // Awal bulan ini
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      // Awal bulan depan
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    } else {
      // month === 'last'
      // Awal bulan lalu
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      // Awal bulan ini
      endDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    whereClause = {
      created_at: {
        gte: startDate, // gte: greater than or equal to
        lt: endDate, // lt: less than
      },
    };
  }
  // Jika month adalah 'all' atau tidak dispesifikasikan, whereClause tetap kosong {}
  // yang berarti akan mengambil semua transaksi.

  try {
    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      orderBy: {
        created_at: "desc", // Urutkan dari yang terbaru
      },
    });

    // Prisma mengembalikan amount sebagai tipe Decimal, kita perlu mengubahnya menjadi number
    const serializedTransactions = transactions.map((tx) => ({
      ...tx,
      amount: Number(tx.amount),
    }));

    return NextResponse.json({ transactions: serializedTransactions });
  } catch (error) {
    console.error("Failed to fetch transactions:", error);
    return NextResponse.json(
      { message: "Internal server error while fetching transactions." },
      { status: 500 }
    );
  }
}
