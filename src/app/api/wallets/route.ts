import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";

const prisma = new PrismaClient();

/**
 * GET /api/wallets — List semua kantong milik user
 */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload?.userId) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const userId = payload.userId as string;

    // Cek user premium
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { plan_type: true } });
    if (!user || user.plan_type !== "PREMIUM") {
      return NextResponse.json({ error: "Fitur ini hanya untuk pengguna Premium." }, { status: 403 });
    }

    const wallets = await prisma.wallet.findMany({
      where: { user_id: userId },
      orderBy: { created_at: "asc" },
    });

    return NextResponse.json(wallets);
  } catch (error) {
    console.error("GET /api/wallets error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * POST /api/wallets — Buat kantong baru
 * Body: { name: string, icon?: string, balance?: number }
 */
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload?.userId) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const userId = payload.userId as string;

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { plan_type: true } });
    if (!user || user.plan_type !== "PREMIUM") {
      return NextResponse.json({ error: "Fitur ini hanya untuk pengguna Premium." }, { status: 403 });
    }

    const body = await request.json();
    const { name, icon, balance } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Nama kantong wajib diisi." }, { status: 400 });
    }

    const normalizedName = name.trim();

    // Cek duplikat
    const existing = await prisma.wallet.findUnique({
      where: { user_id_name: { user_id: userId, name: normalizedName } },
    });
    if (existing) {
      return NextResponse.json({ error: `Kantong "${normalizedName}" sudah ada.` }, { status: 409 });
    }

    const wallet = await prisma.wallet.create({
      data: {
        user_id: userId,
        name: normalizedName,
        icon: icon || null,
        balance: balance || 0,
      },
    });

    return NextResponse.json(wallet, { status: 201 });
  } catch (error) {
    console.error("POST /api/wallets error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
