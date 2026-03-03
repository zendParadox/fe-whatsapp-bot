// middleware.ts - Protects routes from unauthorized access
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth";

// Routes yang memerlukan autentikasi
const protectedRoutes = ["/dashboard", "/profile"];

// Routes yang memerlukan admin access
const adminRoutes = ["/admin"];

export async function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const pathname = url.pathname;

  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isAdminRoute = adminRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtectedRoute || isAdminRoute) {
    try {
      const token = req.cookies.get("token")?.value;

      if (!token) {
        url.pathname = "/unauthorized";
        return NextResponse.redirect(url);
      }

      const payload = verifyToken(token);

      if (!payload || !payload.userId) {
        url.pathname = "/unauthorized";
        return NextResponse.redirect(url);
      }

      // Admin route protection
      if (isAdminRoute && !payload.isAdmin) {
        url.pathname = "/unauthorized";
        return NextResponse.redirect(url);
      }

      return NextResponse.next();
    } catch {
      url.pathname = "/unauthorized";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/profile/:path*", "/admin/:path*"],
};
