/* eslint-disable */
// src/app/api/auth/register/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";
import { hashSync } from "bcryptjs";
import { cookies } from "next/headers";
import { signToken } from "@/lib/auth"; // kalau kamu sudah punya lib/auth (disarankan)

import { normalizePhone, isAllowedPhone, getCurrencyFromPhone } from "@/lib/phone";

const prisma = new PrismaClient();
const BCRYPT_SALT_ROUNDS = 10;


export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({} as any));
    const email = (body.email ?? "").toString().trim().toLowerCase();
    const name = (body.name ?? "").toString().trim();
    const rawPhone = (body.phoneNumber ?? body.whatsapp_jid ?? "")
      .toString()
      .trim();
    const password = (body.password ?? "").toString();

    if (!email || !name || !rawPhone || !password) {
      return NextResponse.json(
        { error: "Semua field harus diisi" },
        { status: 400 }
      );
    }

    // normalisasi whatsapp_jid
    const whatsapp_jid = normalizePhone(rawPhone);

    // validasi: hanya nomor Indonesia (62) dan Australia (61)
    if (!isAllowedPhone(whatsapp_jid)) {
      return NextResponse.json(
        { error: "Hanya nomor Indonesia (62) dan Australia (61) yang didukung." },
        { status: 400 }
      );
    }

    // Auto-detect currency dari country code
    const currency = getCurrencyFromPhone(whatsapp_jid);

    // cek duplicate email / whatsapp_jid
    const exists = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { whatsapp_jid }],
      },
    });

    if (exists) {
      return NextResponse.json(
        { error: "Email atau nomor WhatsApp sudah terdaftar" },
        { status: 409 }
      );
    }

    // hash password
    // const hashed = hashSync(password, BCRYPT_SALT_ROUNDS);

    // create user
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: password,
        whatsapp_jid,
        currency,
      },
    });

    // sign token (gunakan helper di lib/auth jika ada)
    const token = signToken({ userId: user.id });

    // set cookie (HttpOnly)
    const cookieStore = await cookies();
    cookieStore.set({
      name: "token",
      value: token,
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60,
    });

    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        whatsapp_jid: user.whatsapp_jid,
      },
    });
  } catch (err: any) {
    console.error("Register error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  } finally {
    // jangan disconnect prisma di tiap request untuk performance (opsional)
  }
}
