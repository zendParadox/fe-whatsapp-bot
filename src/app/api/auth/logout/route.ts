// src/app/api/auth/logout/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  // hapus cookie token
  const cookieStore = await cookies();
  cookieStore.delete("token");

  return NextResponse.json({ ok: true, message: "Logged out successfully" });
}
