// src/app/api/auth/login/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET ?? "";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? "7d";

function normalizeJid(input: string) {
  if (!input) return "";
  const s = String(input).trim();
  return s.includes("@") ? s : `${s}@s.whatsapp.net`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({} as any));
    const raw =
      body.whatsapp_jid ??
      body.whatsappJid ??
      body.phoneNumber ??
      body.phone ??
      body.jid ??
      body.username ??
      "";
    const password = body.password ?? "";

    if (!raw || !password) {
      return NextResponse.json(
        { error: "Missing credentials" },
        { status: 400 }
      );
    }

    const whatsapp_jid = normalizeJid(raw);

    const user = await prisma.user.findUnique({ where: { whatsapp_jid } });
    if (!user)
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );

    // if DB currently stores plain text use direct compare, otherwise bcrypt.compareSync
    const passwordMatches =
      user.password === password || bcrypt.compareSync(password, user.password);
    if (!passwordMatches)
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );

    if (!JWT_SECRET) {
      console.error("Missing JWT_SECRET env var");
      return NextResponse.json(
        { error: "Server misconfigured" },
        { status: 500 }
      );
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    // IMPORTANT: await cookies() then set cookie
    const cookieStore = await cookies();
    cookieStore.set({
      name: "token",
      value: token,
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    // Return user info (do not return token in production unless needed)
    return NextResponse.json({
      ok: true,
      user: { id: user.id, name: user.name, whatsapp_jid: user.whatsapp_jid },
    });
  } catch (err: any) {
    console.error("Login error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
