/* eslint-disable */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withPerformanceTracking } from "@/lib/performance";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";

async function handleTransactionsGET(request: Request) {
  // Authenticate user
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = verifyToken(token);
  if (!payload?.userId) return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  const userId = payload.userId as string;

  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month");

  // Pagination params (defaults: page=1, limit=50)
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = Math.min(
    100,
    Math.max(1, Number(searchParams.get("limit")) || 50),
  );
  const skip = (page - 1) * limit;

  // Build where clause — ALWAYS scoped to authenticated user
  let whereClause: any = { user_id: userId };

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

    whereClause.created_at = {
      gte: startDate,
      lt: endDate,
    };
  }

  try {
    // Run count and findMany in parallel for efficiency
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where: whereClause,
        orderBy: { created_at: "desc" },
        skip,
        take: limit,
      }),
      prisma.transaction.count({ where: whereClause }),
    ]);

    const serializedTransactions = transactions.map((tx) => {
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

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      transactions: serializedTransactions,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages,
      },
    });
  } catch (error) {
    console.error("Failed to fetch transactions:", error);
    return NextResponse.json(
      { message: "Internal server error while fetching transactions." },
      { status: 500 },
    );
  }
}

async function handleTransactionsPOST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload?.userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
    const userId = payload.userId as string;

    const body = await request.json();
    const { amount, type, description, category_id, date, created_at, wallet_id } = body;
    const finalDate = created_at || date;

    // Basic validation
    if (!amount || !type) {
      return NextResponse.json(
        { error: "Amount and Type are required" },
        { status: 400 },
      );
    }

    // Check user plan for premium features (wallet)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan_type: true },
    });

    let finalWalletId = null;
    const prismaOperations: any[] = [];

    if (wallet_id && user?.plan_type === "PREMIUM") {
      const wallet = await prisma.wallet.findFirst({
        where: { id: wallet_id, user_id: userId },
      });

      if (wallet) {
        finalWalletId = wallet.id;
        const amountNum = Number(amount);
        prismaOperations.push(
          prisma.wallet.update({
            where: { id: wallet.id },
            data: {
              balance: {
                [type === "EXPENSE" ? "decrement" : "increment"]: amountNum,
              },
            },
          }),
        );
      }
    }

    // Queue transaction creation
    prismaOperations.push(
      prisma.transaction.create({
        data: {
          user_id: userId,
          amount: Number(amount),
          type: type,
          description: description || "",
          category_id: category_id || null,
          wallet_id: finalWalletId,
          created_at: finalDate ? new Date(finalDate) : undefined,
        },
      }),
    );

    // Execute atomically
    const results = await prisma.$transaction(prismaOperations);
    const newTx = results[results.length - 1]; // transaction.create is always last

    return NextResponse.json({ data: newTx }, { status: 201 });
  } catch (error) {
    console.error("POST /api/transactions error:", error);
    return NextResponse.json(
      { error: "Failed to create transaction" },
      { status: 500 },
    );
  }
}

export const GET = withPerformanceTracking(
  handleTransactionsGET,
  "/api/transactions",
);
export const POST = withPerformanceTracking(
  handleTransactionsPOST,
  "/api/transactions",
);
