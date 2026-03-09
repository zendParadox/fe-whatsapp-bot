import { NextResponse, type NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "FAM-";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * POST /api/wallets/[id]/invite — Generate invite code for shared wallet
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload?.userId) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const { id } = await params;
    const userId = payload.userId as string;

    // Only owner can generate invite
    const wallet = await prisma.wallet.findFirst({
      where: { id, user_id: userId },
    });

    if (!wallet) {
      return NextResponse.json({ error: "Kantong tidak ditemukan." }, { status: 404 });
    }

    // Check premium
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { plan_type: true } });
    if (!user || user.plan_type !== "PREMIUM") {
      return NextResponse.json({ error: "Fitur ini hanya untuk pengguna Premium." }, { status: 403 });
    }

    // Generate unique invite code
    let inviteCode = generateInviteCode();
    let attempts = 0;
    while (attempts < 10) {
      const existing = await prisma.wallet.findFirst({ where: { invite_code: inviteCode } });
      if (!existing) break;
      inviteCode = generateInviteCode();
      attempts++;
    }

    // Update wallet to be shared and set invite code
    const updated = await prisma.wallet.update({
      where: { id },
      data: {
        is_shared: true,
        invite_code: inviteCode,
      },
    });

    // Add owner as ADMIN member if not already
    await prisma.walletMember.upsert({
      where: { wallet_id_user_id: { wallet_id: id, user_id: userId } },
      create: { wallet_id: id, user_id: userId, role: "ADMIN" },
      update: {},
    });

    return NextResponse.json({
      invite_code: updated.invite_code,
      wallet_name: updated.name,
      message: `Kode undangan: ${updated.invite_code}`,
    });
  } catch (error) {
    console.error("POST /api/wallets/[id]/invite error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
