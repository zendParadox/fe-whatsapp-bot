import { NextResponse, type NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/wallets/join — Join a shared wallet via invite code
 * Body: { invite_code: string }
 */
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload?.userId) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const userId = payload.userId as string;
    const body = await request.json();
    const { invite_code } = body;

    if (!invite_code || typeof invite_code !== "string") {
      return NextResponse.json({ error: "Kode undangan wajib diisi." }, { status: 400 });
    }

    // Find wallet by invite code
    const wallet = await prisma.wallet.findFirst({
      where: { invite_code: invite_code.toUpperCase().trim(), is_shared: true },
      include: { user: { select: { name: true } } },
    });

    if (!wallet) {
      return NextResponse.json({ error: "Kode undangan tidak valid atau sudah kadaluarsa." }, { status: 404 });
    }

    // Check if user is the owner
    if (wallet.user_id === userId) {
      return NextResponse.json({ error: "Anda sudah menjadi pemilik kantong ini." }, { status: 400 });
    }

    // Check if already a member
    const existingMember = await prisma.walletMember.findUnique({
      where: { wallet_id_user_id: { wallet_id: wallet.id, user_id: userId } },
    });

    if (existingMember) {
      return NextResponse.json({ error: "Anda sudah menjadi anggota kantong ini." }, { status: 400 });
    }

    // Add member
    await prisma.walletMember.create({
      data: {
        wallet_id: wallet.id,
        user_id: userId,
        role: "MEMBER",
      },
    });

    return NextResponse.json({
      success: true,
      wallet_name: wallet.name,
      owner_name: wallet.user?.name || "Unknown",
      message: `Berhasil bergabung ke kantong "${wallet.name}"!`,
    });
  } catch (error) {
    console.error("POST /api/wallets/join error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
