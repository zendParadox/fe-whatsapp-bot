// file: app/api/dashboard/route.ts

import { NextResponse, type NextRequest } from "next/server";
import { PrismaClient, TransactionType } from "@prisma/client";
import type { Decimal } from "@prisma/client/runtime/library";
import {
  startOfMonth,
  endOfMonth,
  subMonths,
  format,
  parseISO,
  startOfDay,
  endOfDay,
  subDays,
  differenceInDays,
} from "date-fns";

const prisma = new PrismaClient();

// -----------------------------
// Opsi B: Infer tipe dari query
// -----------------------------
// Helper yang hanya dipakai untuk infer tipe TypeScript.
// Jangan panggil helper ini saat runtime — kita hanya gunakan ReturnType<> pada level type.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _fetchTransactionsWithCategory = () =>
  prisma.transaction.findMany({ include: { category: true } });

type TransactionWithCategory = Awaited<
  ReturnType<typeof _fetchTransactionsWithCategory>
>[number];

// -----------------------------
// Tipe lain untuk response/data
// -----------------------------
interface Summary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}
type TrendRecord = {
  type: TransactionType;
  created_at: Date;
  _sum: {
    amount: Decimal | null;
  };
};

export async function GET(request: NextRequest) {
  try {
    // --- 1. PENGATURAN PERIODE & USER ---
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    // TODO: Ganti dengan logic otentikasi
    const userId = "user-123";
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let startDate: Date;
    let endDate: Date;
    const now = new Date();

    if (from && to) {
      startDate = startOfDay(parseISO(from));
      endDate = endOfDay(parseISO(to));
    } else {
      startDate = startOfMonth(now);
      endDate = endOfMonth(now);
    }

    const durationInDays = differenceInDays(endDate, startDate) + 1;
    const previousPeriodEndDate = endOfDay(subDays(startDate, 1));
    const previousPeriodStartDate = startOfDay(
      subDays(previousPeriodEndDate, durationInDays - 1)
    );

    // --- 2. QUERY DATABASE SECARA PARALEL ---
    const [currentTransactions, previousSummary, budgets, trendDataRaw] =
      await Promise.all([
        prisma.transaction.findMany({
          where: {
            user_id: userId,
            created_at: { gte: startDate, lte: endDate },
          },
          include: { category: true },
          orderBy: { created_at: "desc" },
        }),
        prisma.transaction.aggregate({
          where: {
            user_id: userId,
            type: "EXPENSE",
            created_at: {
              gte: previousPeriodStartDate,
              lte: previousPeriodEndDate,
            },
          },
          _sum: { amount: true },
        }),
        prisma.budget.findMany({
          where: {
            user_id: userId,
            month: startDate.getMonth() + 1,
            year: startDate.getFullYear(),
          },
          include: { category: true },
        }),
        prisma.transaction.groupBy({
          by: ["type", "created_at"],
          where: {
            user_id: userId,
            created_at: {
              gte: startOfMonth(subMonths(now, 5)),
              lte: endOfMonth(now),
            },
          },
          _sum: { amount: true },
          orderBy: { created_at: "asc" },
        }),
      ]);

    // --- 3. PROSES DATA HASIL QUERY ---

    const summary = currentTransactions.reduce(
      (acc: Summary, tx) => {
        if (tx.type === "INCOME") acc.totalIncome += Number(tx.amount);
        else acc.totalExpense += Number(tx.amount);
        return acc;
      },
      { totalIncome: 0, totalExpense: 0, balance: 0 }
    );
    summary.balance = summary.totalIncome - summary.totalExpense;

    const categoryExpenses = (currentTransactions as TransactionWithCategory[])
      .filter((tx) => tx.type === "EXPENSE")
      .reduce((acc: Record<string, number>, tx) => {
        acc[tx.category.name] =
          (acc[tx.category.name] || 0) + Number(tx.amount);
        return acc;
      }, {});

    const topCategories = Object.entries(categoryExpenses)
      .sort(([, a]: [string, number], [, b]: [string, number]) => b - a)
      .slice(0, 5)
      .map(([category, amount]) => ({ category, amount }));

    const avgDailyExpense =
      summary.totalExpense > 0 ? summary.totalExpense / durationInDays : 0;

    const budgetData = budgets.map((b) => {
      const actual = categoryExpenses[b.category.name] || 0;
      return {
        category: b.category.name,
        budget: Number(b.amount),
        actual,
      };
    });

    const trendMap = (trendDataRaw as TrendRecord[]).reduce((acc, record) => {
      const monthYear = format(new Date(record.created_at), "MMM yyyy");
      if (!acc[monthYear]) {
        acc[monthYear] = {
          name: format(new Date(record.created_at), "MMM"),
          Pemasukan: 0,
          Pengeluaran: 0,
        };
      }
      const amount = Number(record._sum?.amount ?? 0);
      if (record.type === "INCOME") acc[monthYear].Pemasukan += amount;
      else acc[monthYear].Pengeluaran += amount;
      return acc;
    }, {} as Record<string, { name: string; Pemasukan: number; Pengeluaran: number }>);
    const trendData = Object.values(trendMap);

    // --- 4. STRUKTURKAN DATA RESPON FINAL ---
    const responseData = {
      currentPeriod: {
        summary,
        transactions: currentTransactions,
        topCategories,
        avgDailyExpense,
      },
      previousPeriod: {
        summary: {
          totalExpense: Number(previousSummary._sum?.amount ?? 0),
        },
      },
      trendData,
      budgetData,
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("API Error:", error);
    let errorMessage = "Gagal mengambil data dashboard";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
