/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/wallets/[id]/transactions — Get all transactions for a wallet (from all members)
 * Only accessible by wallet owner or members
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload?.userId) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const userId = payload.userId as string;
    const { id: walletId } = await params;

    // Find the wallet
    const wallet = await prisma.wallet.findUnique({
      where: { id: walletId },
      include: {
        user: { select: { name: true, whatsapp_jid: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, whatsapp_jid: true } },
          },
        },
      },
    });

    if (!wallet) {
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
    }

    // Check access: owner or member
    const isOwner = wallet.user_id === userId;
    const isMember = (wallet as any).members?.some((m: any) => m.user_id === userId);

    if (!isOwner && !isMember) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Fetch all transactions linked to this wallet (from all users)
    const transactions = await prisma.transaction.findMany({
      where: { wallet_id: walletId },
      include: {
        category: true,
        user: { select: { name: true, whatsapp_jid: true } },
      },
      orderBy: { created_at: "desc" },
      take: 100,
    });

    // Prepare member list
    const members = (wallet as any).members?.map((m: any) => ({
      id: m.user.id,
      name: m.user.name,
      phone: m.user.whatsapp_jid,
      role: m.role,
      joined_at: m.joined_at,
    })) || [];

    return NextResponse.json({
      wallet: {
        id: wallet.id,
        name: wallet.name,
        icon: wallet.icon,
        balance: Number(wallet.balance),
        is_shared: (wallet as any).is_shared || false,
        invite_code: isOwner ? (wallet as any).invite_code : undefined,
        owner: {
          name: (wallet as any).user?.name,
          phone: (wallet as any).user?.whatsapp_jid,
        },
        members,
      },
      transactions: transactions.map((tx: any) => ({
        id: tx.id,
        type: tx.type,
        amount: Number(tx.amount),
        description: tx.description,
        category: tx.category?.name || "Uncategorized",
        created_at: tx.created_at,
        recorded_by: tx.user?.name || tx.user?.whatsapp_jid || "Unknown",
      })),
    });
  } catch (error) {
    console.error("GET /api/wallets/[id]/transactions error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
