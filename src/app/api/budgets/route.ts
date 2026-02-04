/*eslint-disable*/
import { NextResponse, type NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";

const prisma = new PrismaClient();

// GET: Mendapatkan semua budget user untuk bulan/tahun tertentu
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload?.userId)
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const userId = payload.userId as string;

    // Ambil parameter bulan dan tahun dari query string
    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1));
    const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));

    const budgets = await prisma.budget.findMany({
      where: {
        user_id: userId,
        month,
        year,
      },
      include: {
        category: true,
      },
      orderBy: {
        category: {
          name: "asc",
        },
      },
    });

    return NextResponse.json(budgets);
  } catch (err) {
    console.error("GET /api/budgets error:", err);
    return NextResponse.json(
      { error: "Gagal mengambil budget" },
      { status: 500 }
    );
  }
}

// POST: Membuat budget baru
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload?.userId)
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const userId = payload.userId as string;

    const body = await request.json();
    const { category_id, amount, month, year } = body;

    // Validasi input
    if (!category_id) {
      return NextResponse.json(
        { error: "Kategori diperlukan" },
        { status: 400 }
      );
    }
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Jumlah budget harus lebih dari 0" },
        { status: 400 }
      );
    }

    const budgetMonth = month || new Date().getMonth() + 1;
    const budgetYear = year || new Date().getFullYear();

    // Cek apakah budget untuk kategori ini sudah ada di bulan/tahun yang sama
    const existing = await prisma.budget.findUnique({
      where: {
        user_id_category_id_month_year: {
          user_id: userId,
          category_id,
          month: budgetMonth,
          year: budgetYear,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Budget untuk kategori ini sudah ada di bulan yang sama" },
        { status: 409 }
      );
    }

    // Verifikasi kategori milik user
    const category = await prisma.category.findFirst({
      where: {
        id: category_id,
        user_id: userId,
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Kategori tidak ditemukan" },
        { status: 404 }
      );
    }

    const created = await prisma.budget.create({
      data: {
        amount,
        month: budgetMonth,
        year: budgetYear,
        category_id,
        user_id: userId,
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error("POST /api/budgets error:", err);
    return NextResponse.json(
      { error: "Gagal membuat budget" },
      { status: 500 }
    );
  }
}
