/* eslint-disable */
import { NextResponse, type NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { subMonths, startOfMonth, endOfMonth, format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";
import { formatMoney } from "@/lib/phone";

const prisma = new PrismaClient();

// Support multiple API keys for rotation
const apiKeysString = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || "";
const apiKeys = apiKeysString.split(",").map(k => k.trim()).filter(k => k.length > 0);

function getGeminiClient(): GoogleGenerativeAI | null {
  if (apiKeys.length === 0) return null;
  // Simple rotation: use first available key
  return new GoogleGenerativeAI(apiKeys[0]);
}

interface TransactionSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  categoryBreakdown: { category: string; amount: number }[];
  transactionCount: number;
}

async function generateAnalysis(summary: TransactionSummary, monthName: string, year: number, currency: string = "IDR"): Promise<string> {
  const genAI = getGeminiClient();
  if (!genAI) {
    throw new Error("Gemini API key tidak dikonfigurasi");
  }

  const fmt = (v: number) => formatMoney(v, currency);

  const prompt = `
Kamu adalah konsultan keuangan pribadi yang senang me-roasting dan kocak. Analisis data keuangan berikut dari bulan ${monthName} ${year}:

DATA KEUANGAN:
- Total Pemasukan: ${fmt(summary.totalIncome)}
- Total Pengeluaran: ${fmt(summary.totalExpense)}
- Saldo: ${fmt(summary.balance)}
- Jumlah Transaksi: ${summary.transactionCount}

PENGELUARAN PER KATEGORI:
${summary.categoryBreakdown.map(c => `- ${c.category}: ${fmt(c.amount)}`).join("\n")}

Berikan analisis dalam format berikut (langsung dalam Bahasa Indonesia yang natural dalam me-roasting):

## 📊 Ringkasan Bulan ${monthName}

[Berikan ringkasan singkat kondisi keuangan bulan ini - apakah sehat atau perlu perbaikan]

## 💡 Insight Utama

[Berikan 2-3 poin insight paling penting dari data ini]

## ⚠️ Perhatian

[Jika ada hal yang perlu diperhatikan seperti pengeluaran berlebihan di kategori tertentu. Jika tidak ada, skip bagian ini]

## 💰 Tips untuk Bulan Depan

[Berikan 2-3 tips praktis berdasarkan pola pengeluaran yang terlihat]

Catatan: Gunakan emoji yang sesuai, bullet points, dan bahasa yang santai tapi informatif. Jangan terlalu panjang - maksimal 300 kata.
`;

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error: any) {
    console.error("Gemini analysis error:", error);
    throw new Error("Gagal menghasilkan analisis AI");
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
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

    // Calculate previous month (n-1)
    const now = new Date();
    const previousMonth = subMonths(now, 1);
    const month = previousMonth.getMonth() + 1; // 1-12
    const year = previousMonth.getFullYear();
    const monthName = format(previousMonth, "MMMM", { locale: idLocale });

    // Check if analysis already exists
    const existingAnalysis = await prisma.monthlyAnalysis.findUnique({
      where: {
        user_id_month_year: {
          user_id: userId,
          month: month,
          year: year,
        },
      },
    });

    if (existingAnalysis) {
      return NextResponse.json({
        analysis: existingAnalysis.content,
        month: month,
        year: year,
        monthName: monthName,
        isNewlyGenerated: false,
      });
    }

    // Get transactions for previous month
    const startDate = startOfMonth(previousMonth);
    const endDate = endOfMonth(previousMonth);

    const transactions = await prisma.transaction.findMany({
      where: {
        user_id: userId,
        created_at: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: { category: true },
    });

    // Calculate summary
    let totalIncome = 0;
    let totalExpense = 0;
    const categoryExpenses: Record<string, number> = {};

    for (const tx of transactions) {
      const amount = Number(tx.amount);
      if (tx.type === "INCOME") {
        totalIncome += amount;
      } else {
        totalExpense += amount;
        const catName = tx.category?.name || "Lainnya";
        categoryExpenses[catName] = (categoryExpenses[catName] || 0) + amount;
      }
    }

    const summary: TransactionSummary = {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      categoryBreakdown: Object.entries(categoryExpenses)
        .sort(([, a], [, b]) => b - a)
        .map(([category, amount]) => ({ category, amount })),
      transactionCount: transactions.length,
    };

    // Check if there's any data to analyze
    if (transactions.length === 0) {
      return NextResponse.json({
        analysis: `## 📊 Belum Ada Data\n\nTidak ada transaksi yang tercatat di bulan ${monthName} ${year}. Mulai catat pengeluaran dan pemasukan Anda untuk mendapatkan analisis keuangan!`,
        month: month,
        year: year,
        monthName: monthName,
        isNewlyGenerated: true,
        noData: true,
      });
    }

    // Fetch user's currency
    const currentUser = await prisma.user.findUnique({ where: { id: userId } });
    const userCurrency = currentUser?.currency || "IDR";

    // Generate analysis using Gemini
    const analysisContent = await generateAnalysis(summary, monthName, year, userCurrency);

    // Save to database
    await prisma.monthlyAnalysis.create({
      data: {
        user_id: userId,
        month: month,
        year: year,
        content: analysisContent,
      },
    });

    return NextResponse.json({
      analysis: analysisContent,
      month: month,
      year: year,
      monthName: monthName,
      isNewlyGenerated: true,
      summary: {
        totalIncome,
        totalExpense,
        balance: totalIncome - totalExpense,
      },
    });
  } catch (error) {
    console.error("AI Analysis API Error:", error);
    let errorMessage = "Gagal mengambil analisis";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
