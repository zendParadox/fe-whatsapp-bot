import { NextResponse } from "next/server";

import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/wallets/[id] — Edit nama/saldo/icon kantong
 * Body: { name?, icon?, balance? }
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload?.userId) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const userId = payload.userId as string;

    const wallet = await prisma.wallet.findUnique({ where: { id } });
    if (!wallet || wallet.user_id !== userId) {
      return NextResponse.json({ error: "Kantong tidak ditemukan." }, { status: 404 });
    }

    const body = await request.json();
    const updateData: Record<string, unknown> = {};

    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.icon !== undefined) updateData.icon = body.icon;
    if (body.balance !== undefined) updateData.balance = Number(body.balance);

    const updated = await prisma.wallet.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/wallets/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * DELETE /api/wallets/[id] — Hapus kantong
 */
export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload?.userId) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const userId = payload.userId as string;

    const wallet = await prisma.wallet.findUnique({ where: { id } });
    if (!wallet || wallet.user_id !== userId) {
      return NextResponse.json({ error: "Kantong tidak ditemukan." }, { status: 404 });
    }

    // Atomically detach transactions and delete wallet
    await prisma.$transaction([
      prisma.transaction.updateMany({
        where: { wallet_id: id },
        data: { wallet_id: null },
      }),
      prisma.wallet.delete({ where: { id } }),
    ]);

    return NextResponse.json({ message: "Kantong berhasil dihapus." });
  } catch (error) {
    console.error("DELETE /api/wallets/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
