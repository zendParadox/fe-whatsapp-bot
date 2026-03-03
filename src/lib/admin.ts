import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";

/**
 * Verify that the current request is from an admin user.
 * Returns { userId, isAdmin } if valid, or a NextResponse error if not.
 */
export async function verifyAdmin(): Promise<
  { userId: string; isAdmin: true } | NextResponse
> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = verifyToken(token);
  if (!payload?.userId) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  if (!payload.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return { userId: payload.userId as string, isAdmin: true };
}
