/*eslint-disable*/
// app/api/categories/route.ts
import { NextResponse, type NextRequest } from "next/server";

import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";

import { prisma } from "@/lib/prisma";
import { categoriesCache } from "@/lib/cache";

export async function GET(_request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload?.userId)
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const userId = payload.userId as string;

    // Check cache first (30s TTL)
    const cached = categoriesCache.get(userId);
    if (cached) {
      return NextResponse.json(cached);
    }

    // ambil semua kategori milik user, urut berdasarkan nama
    const categories = await prisma.category.findMany({
      where: { user_id: userId },
      orderBy: { name: "asc" },
    });

    // Store in cache
    categoriesCache.set(userId, categories);

    return NextResponse.json(categories);
  } catch (err) {
    console.error("GET /api/categories error:", err);
    return NextResponse.json(
      { error: "Gagal mengambil kategori" },
      { status: 500 }
    );
  }
}

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
    const name = (body.name ?? "").trim();
    if (!name)
      return NextResponse.json(
        { error: "Nama kategori diperlukan" },
        { status: 400 }
      );

    // cek unique per user
    const existing = await prisma.category.findFirst({
      where: { user_id: userId, name },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Kategori sudah ada" },
        { status: 409 }
      );
    }

    const created = await prisma.category.create({
      data: {
        name,
        user_id: userId,
      },
    });

    // Invalidate cache so next GET returns fresh data
    categoriesCache.invalidate(userId);

    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error("POST /api/categories error:", err);
    return NextResponse.json(
      { error: "Gagal membuat kategori" },
      { status: 500 }
    );
  }
}
