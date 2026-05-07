// middleware.ts - Protects routes from unauthorized access
// Uses 'jose' (Edge Runtime compatible) instead of 'jsonwebtoken' (Node.js only)
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

// Routes yang memerlukan autentikasi
const protectedRoutes = ["/dashboard", "/profile"];

// Routes yang memerlukan admin access
const adminRoutes = ["/admin"];

// Routes yang hanya untuk guest (belum login)
const guestOnlyRoutes = ["/login", "/register"];

async function verifyTokenEdge(token: string) {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error("[Middleware] JWT_SECRET is missing!");
      return null;
    }
    
    const key = new TextEncoder().encode(secret);
    const { payload } = await jwtVerify(token, key, {
      algorithms: ["HS256"],
    });
    return payload as { userId?: string; isAdmin?: boolean };
  } catch (err) {
    console.error("[Middleware] Token verification failed:", err);
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const pathname = url.pathname;

  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isAdminRoute = adminRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // --- Root route: redirect to dashboard if already logged in ---
  if (pathname === "/") {
    const token = req.cookies.get("token")?.value;
    if (token) {
      const payload = await verifyTokenEdge(token);
      if (payload && payload.userId) {
        url.pathname = "/dashboard";
        return NextResponse.redirect(url);
      }
    }
    return NextResponse.next();
  }

  // --- Protected routes: require valid token ---
  if (isProtectedRoute || isAdminRoute) {
    const token = req.cookies.get("token")?.value;

    if (!token) {
      console.log("[Middleware] No token found for protected route:", pathname);
      url.pathname = "/unauthorized";
      return NextResponse.redirect(url);
    }

    console.log("[Middleware] Verifying token for:", pathname);
    const payload = await verifyTokenEdge(token);

    if (!payload || !payload.userId) {
      console.log("[Middleware] Invalid token for:", pathname, "payload:", payload);
      url.pathname = "/unauthorized";
      return NextResponse.redirect(url);
    }

    // Admin route protection
    if (isAdminRoute && !payload.isAdmin) {
      url.pathname = "/unauthorized";
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  }

  // --- Guest-only routes: redirect to dashboard if already logged in ---
  const isGuestRoute = guestOnlyRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (isGuestRoute) {
    const token = req.cookies.get("token")?.value;
    if (token) {
      const payload = await verifyTokenEdge(token);
      if (payload && payload.userId) {
        url.pathname = "/dashboard";
        return NextResponse.redirect(url);
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/dashboard/:path*", "/profile/:path*", "/admin/:path*", "/login", "/register"],
};
