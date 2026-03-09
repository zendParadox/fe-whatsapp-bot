import { NextResponse, type NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/wallets/[id]/members — List members of a shared wallet
 */
export async function GET(
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

    // Check if user is owner or member
    const wallet = await prisma.wallet.findFirst({
      where: {
        id,
        OR: [
          { user_id: userId },
          { members: { some: { user_id: userId } } },
        ],
      },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
          orderBy: { joined_at: "asc" },
        },
        user: { select: { id: true, name: true, email: true } },
      },
    });

    if (!wallet) {
      return NextResponse.json({ error: "Kantong tidak ditemukan." }, { status: 404 });
    }

    return NextResponse.json({
      wallet_id: wallet.id,
      wallet_name: wallet.name,
      is_shared: wallet.is_shared,
      invite_code: wallet.user_id === userId ? wallet.invite_code : null,
      owner: wallet.user,
      members: wallet.members.map(m => ({
        id: m.id,
        role: m.role,
        user: m.user,
        joined_at: m.joined_at,
      })),
    });
  } catch (error) {
    console.error("GET /api/wallets/[id]/members error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * DELETE /api/wallets/[id]/members — Remove a member (body: { member_user_id })
 */
export async function DELETE(
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

    // Only owner can remove members
    const wallet = await prisma.wallet.findFirst({
      where: { id, user_id: userId },
    });

    if (!wallet) {
      return NextResponse.json({ error: "Hanya pemilik kantong yang bisa menghapus anggota." }, { status: 403 });
    }

    const body = await request.json();
    const { member_user_id } = body;

    if (!member_user_id) {
      return NextResponse.json({ error: "member_user_id wajib diisi." }, { status: 400 });
    }

    // Cannot remove yourself (owner)
    if (member_user_id === userId) {
      return NextResponse.json({ error: "Tidak bisa menghapus diri sendiri dari kantong." }, { status: 400 });
    }

    await prisma.walletMember.deleteMany({
      where: { wallet_id: id, user_id: member_user_id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/wallets/[id]/members error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
