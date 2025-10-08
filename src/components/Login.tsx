/* eslint-disable */
// src/app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { serialize } from "cookie";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? "7d";

function normalizeJid(input: string) {
  if (!input) return "";
  input = input.trim();
  if (input.includes("@")) return input;
  return `${input}@s.whatsapp.net`;
}

export async function POST(req: Request) {
  try {
    const raw = await req.text();
    let body: any = {};
    try {
      body = raw ? JSON.parse(raw) : {};
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const rawJid =
      body.whatsapp_jid ??
      body.whatsappJid ??
      body.phoneNumber ??
      body.phone ??
      body.jid ??
      body.username ??
      "";
    const password = body.password ?? "";

    if (!rawJid || !password) {
      return NextResponse.json(
        { error: "Missing credentials" },
        { status: 400 }
      );
    }

    const whatsapp_jid = normalizeJid(String(rawJid));

    const user = await prisma.user.findUnique({ where: { whatsapp_jid } });
    if (!user)
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );

    // NOTE: you said passwords are plain text in DB — use direct compare in dev.
    const passwordMatches =
      user.password === password || bcrypt.compareSync(password, user.password);
    if (!passwordMatches)
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );

    if (!JWT_SECRET) {
      console.error("Missing JWT_SECRET");
      return NextResponse.json(
        { error: "Server misconfigured" },
        { status: 500 }
      );
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    const cookie = serialize("token", token, {
      httpOnly: true,
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production", // <-- important: only secure in production
    });

    // Debug log (server-side)
    console.log("Login success — Set-Cookie header:", cookie);

    // Return cookie and token in body (token in body is DEV ONLY for debugging)
    const res = NextResponse.json({
      ok: true,
      token, // remove this in production once cookie working
      user: { id: user.id, name: user.name, whatsapp_jid: user.whatsapp_jid },
    });
    res.headers.set("Set-Cookie", cookie);
    return res;
  } catch (err: any) {
    console.error("Login route error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
