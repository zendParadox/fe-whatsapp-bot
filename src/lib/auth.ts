/* eslint-disable */
// src/lib/auth.ts
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? "7d";

if (!JWT_SECRET) {
  throw new Error("Missing JWT_SECRET in environment variables");
}

export function hashPassword(plain: string) {
  return bcrypt.hashSync(plain, 10);
}

export function verifyPassword(plain: string, hashed: string) {
  return bcrypt.compareSync(plain, hashed);
}

export function signToken(payload: object) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as any;
  } catch (e) {
    return null;
  }
}

// helper to set cookie in server response
export function createAuthCookie(token: string) {
  // cookie string for Set-Cookie header
  // HttpOnly, Secure in production, SameSite Lax
  const cookieParts = [
    `token=${token}`,
    `Path=/`,
    `HttpOnly`,
    `SameSite=Lax`,
    `Max-Age=${7 * 24 * 60 * 60}`, // 7 days (match JWT_EXPIRES_IN)
  ];
  if (process.env.NODE_ENV === "production") {
    cookieParts.push("Secure");
  }
  return cookieParts.join("; ");
}

// helper to clear cookie
export function clearAuthCookie() {
  const cookieParts = [`token=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax`];
  if (process.env.NODE_ENV === "production") cookieParts.push("Secure");
  return cookieParts.join("; ");
}
