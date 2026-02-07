// middleware.ts - Protects routes from unauthorized access
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth";

// Routes yang memerlukan autentikasi
const protectedRoutes = ["/dashboard", "/profile"];

export async function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const pathname = url.pathname;
  // Cek apakah path dimulai dengan salah satu protected routes
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtectedRoute) {
    try {
      // Ambil cookie token
      const token = req.cookies.get("token")?.value;
      
      if (!token) {
        url.pathname = "/unauthorized";
        return NextResponse.redirect(url);
      }

      // Verifikasi token
      const payload = verifyToken(token);
      
      if (!payload || !payload.userId) {
        url.pathname = "/unauthorized";
        return NextResponse.redirect(url);
      }

      // Token valid, lanjutkan
      return NextResponse.next();
    } catch {
      // Error verifikasi, redirect ke unauthorized
      url.pathname = "/unauthorized";
      return NextResponse.redirect(url);
    }
  }

  // Route lain, lanjutkan
  return NextResponse.next();
}

// Matcher untuk routes yang perlu dicek middleware
export const config = {
  matcher: ["/dashboard/:path*", "/profile/:path*"],
};
