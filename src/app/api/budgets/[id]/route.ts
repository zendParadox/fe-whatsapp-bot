/*eslint-disable*/
import { NextResponse, type NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";

const prisma = new PrismaClient();

// PUT: Update budget
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload?.userId)
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const userId = payload.userId as string;
    const { id } = await params;

    // Cek budget ada dan milik user
    const existing = await prisma.budget.findFirst({
      where: {
        id,
        user_id: userId,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Budget tidak ditemukan" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { amount, category_id, month, year } = body;

    // Validasi amount
    if (amount !== undefined && amount <= 0) {
      return NextResponse.json(
        { error: "Jumlah budget harus lebih dari 0" },
        { status: 400 }
      );
    }

    // Jika mengubah category, bulan, atau tahun, cek duplikat
    if (category_id || month || year) {
      const newCategoryId = category_id || existing.category_id;
      const newMonth = month || existing.month;
      const newYear = year || existing.year;

      const duplicate = await prisma.budget.findFirst({
        where: {
          user_id: userId,
          category_id: newCategoryId,
          month: newMonth,
          year: newYear,
          NOT: { id },
        },
      });

      if (duplicate) {
        return NextResponse.json(
          { error: "Budget untuk kategori ini sudah ada di bulan yang sama" },
          { status: 409 }
        );
      }
    }

    const updateData: any = {};
    if (amount !== undefined) updateData.amount = amount;
    if (category_id) updateData.category_id = category_id;
    if (month) updateData.month = month;
    if (year) updateData.year = year;

    const updated = await prisma.budget.update({
      where: { id },
      data: updateData,
      include: { category: true },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("PUT /api/budgets/[id] error:", err);
    return NextResponse.json(
      { error: "Gagal mengupdate budget" },
      { status: 500 }
    );
  }
}

// DELETE: Hapus budget
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload?.userId)
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const userId = payload.userId as string;
    const { id } = await params;

    // Cek budget ada dan milik user
    const existing = await prisma.budget.findFirst({
      where: {
        id,
        user_id: userId,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Budget tidak ditemukan" },
        { status: 404 }
      );
    }

    await prisma.budget.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Budget berhasil dihapus" });
  } catch (err) {
    console.error("DELETE /api/budgets/[id] error:", err);
    return NextResponse.json(
      { error: "Gagal menghapus budget" },
      { status: 500 }
    );
  }
}
