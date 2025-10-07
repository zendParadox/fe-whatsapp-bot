// file: app/api/dashboard/route.ts

import { NextResponse, type NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";
import {
  startOfMonth,
  endOfMonth,
  subMonths,
  format,
  parseISO,
  startOfDay,
  endOfDay,
  subDays,
  differenceInDays, // BARU: Impor fungsi baru
} from "date-fns";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // --- 1. PENGATURAN PERIODE & USER ---
    const { searchParams } = new URL(request.url);
    // BARU: Baca parameter 'from' dan 'to'
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const userId = "user-123"; // TODO: Ganti dengan logic otentikasi
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // BARU: Logika untuk menangani rentang tanggal kustom
    let startDate: Date;
    let endDate: Date;
    const now = new Date();

    if (from && to) {
      startDate = startOfDay(parseISO(from));
      endDate = endOfDay(parseISO(to));
    } else {
      // Default jika tidak ada rentang tanggal: bulan ini
      startDate = startOfMonth(now);
      endDate = endOfMonth(now);
    }

    // BARU: Hitung periode sebelumnya berdasarkan durasi rentang saat ini
    const durationInDays = differenceInDays(endDate, startDate) + 1;
    const previousPeriodEndDate = endOfDay(subDays(startDate, 1));
    const previousPeriodStartDate = startOfDay(
      subDays(previousPeriodEndDate, durationInDays - 1)
    );

    // --- 2. QUERY DATABASE SECARA PARALEL ---
    const [currentTransactions, previousSummary, budgets, trendDataRaw] =
      await Promise.all([
        // Query 1: Ambil transaksi di periode kustom
        prisma.transaction.findMany({
          where: {
            user_id: userId,
            created_at: { gte: startDate, lte: endDate }, // DIPERBAIKI: Menggunakan startDate & endDate dinamis
          },
          include: { category: true },
          orderBy: { created_at: "desc" },
        }),

        // Query 2: Ambil ringkasan pengeluaran periode sebelumnya yang dinamis
        prisma.transaction.aggregate({
          where: {
            user_id: userId,
            type: "EXPENSE",
            created_at: {
              gte: previousPeriodStartDate, // DIPERBAIKI
              lte: previousPeriodEndDate, // DIPERBAIKI
            },
          },
          _sum: { amount: true },
        }),

        // Query 3: Ambil budget untuk bulan dari startDate
        // Catatan: Untuk rentang multi-bulan, logika ini bisa diperluas
        prisma.budget.findMany({
          where: {
            user_id: userId,
            month: startDate.getMonth() + 1,
            year: startDate.getFullYear(),
          },
          include: { category: true },
        }),

        // Query 4: Data tren tetap 6 bulan terakhir untuk konteks
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
      (acc, tx) => {
        if (tx.type === "INCOME") acc.totalIncome += Number(tx.amount);
        else acc.totalExpense += Number(tx.amount);
        return acc;
      },
      { totalIncome: 0, totalExpense: 0, balance: 0 }
    );
    summary.balance = summary.totalIncome - summary.totalExpense;

    const categoryExpenses = currentTransactions
      .filter((tx) => tx.type === "EXPENSE")
      .reduce((acc, tx) => {
        acc[tx.category.name] =
          (acc[tx.category.name] || 0) + Number(tx.amount);
        return acc;
      }, {} as Record<string, number>);

    const topCategories = Object.entries(categoryExpenses)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([category, amount]) => ({ category, amount }));

    // DIPERBAIKI: Rata-rata pengeluaran harian berdasarkan durasi
    const avgDailyExpense = summary.totalExpense / durationInDays;

    const budgetData = budgets.map((b) => {
      const actual = categoryExpenses[b.category.name] || 0;
      return {
        category: b.category.name,
        budget: Number(b.amount),
        actual,
      };
    });

    const trendMap = trendDataRaw.reduce((acc, record) => {
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
    return NextResponse.json(
      { error: "Gagal mengambil data dashboard" },
      { status: 500 }
    );
  }
}
