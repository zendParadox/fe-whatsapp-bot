// middleware.ts (root project) or app/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth"; // pastikan path ini benar

// Jika ingin menambahkan path lain yang dilindungi, tambahkan ke matcher di export
export async function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const pathname = url.pathname;

  // protect semua route yang dimulai dengan /dashboard (ubah sesuai kebutuhan)
  if (pathname.startsWith("/dashboard")) {
    try {
      // ambil cookie token
      const token = req.cookies.get("token")?.value;
      if (!token) {
        url.pathname = "/unauthorized";
        return NextResponse.redirect(url);
      }

      // verifikasi token (harus synchronous atau promise)
      const payload = verifyToken(token);
      if (!payload || !payload.userId) {
        url.pathname = "/unauthorized";
        return NextResponse.redirect(url);
      }

      // allowed: lanjutkan
      return NextResponse.next();
    } catch (err) {
      // bila error verifikasi, redirect ke unauthorized
      url.pathname = "/unauthorized";
      return NextResponse.redirect(url);
    }
  }

  // untuk route lain, lanjut
  return NextResponse.next();
}

// Atur matcher kalau meletakkan middleware di tempat lain atau ingin membatasi
export const config = {
  matcher: ["/dashboard/:path*", "/app/protected/:path*"], // modifikasi sesuai kebutuhan
};
