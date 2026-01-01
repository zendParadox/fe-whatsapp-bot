/* eslint-disable */
// src/app/api/auth/register/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";
import { hashSync } from "bcryptjs";
import { cookies } from "next/headers";
import { signToken } from "@/lib/auth"; // kalau kamu sudah punya lib/auth (disarankan)

const prisma = new PrismaClient();
const BCRYPT_SALT_ROUNDS = 10;

/**
 * Normalize phone number to WhatsApp JID format.
 * Converts various input formats to: 62xxx@s.whatsapp.net
 * @example "081234567890" -> "6281234567890@s.whatsapp.net"
 * @example "+6281234567890" -> "6281234567890@s.whatsapp.net"
 * @example "6281234567890" -> "6281234567890@s.whatsapp.net"
 */
function normalizePhoneToJid(phone: string): string {
  // Remove all non-digit characters except + at the beginning
  let cleaned = phone.replace(/[^\d+]/g, "");

  // Remove leading + if exists
  if (cleaned.startsWith("+")) {
    cleaned = cleaned.substring(1);
  }

  // Convert leading 0 to 62 (Indonesia country code)
  if (cleaned.startsWith("0")) {
    cleaned = "62" + cleaned.substring(1);
  }

  // If somehow it doesn't start with 62, add it (for edge cases like just "81234567890")
  if (!cleaned.startsWith("62") && cleaned.length >= 9 && cleaned.length <= 12) {
    cleaned = "62" + cleaned;
  }

  return `${cleaned}@s.whatsapp.net`;
}

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

    // normalisasi whatsapp_jid jadi bentuk lengkap (62xxx@s.whatsapp.net)
    const whatsapp_jid = rawPhone.includes("@")
      ? rawPhone
      : normalizePhoneToJid(rawPhone);

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
    const hashed = hashSync(password, BCRYPT_SALT_ROUNDS);

    // create user
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashed,
        whatsapp_jid,
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
