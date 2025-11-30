// app/unauthorized/page.tsx
"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import React from "react";

export default function UnauthorizedPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-6">
      <div className="max-w-xl w-full bg-white dark:bg-slate-800 rounded-lg shadow-md p-8 text-center">
        <div className="mx-auto w-20 h-20 rounded-full bg-red-50 dark:bg-red-900/30 flex items-center justify-center">
          <AlertTriangle className="w-10 h-10 text-red-600" />
        </div>

        <h1 className="mt-6 text-2xl font-semibold text-slate-900 dark:text-white">
          Akses Ditolak
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Anda tidak memiliki izin untuk mengakses halaman ini. Silakan masuk
          terlebih dahulu atau hubungi administrator jika Anda yakin ini sebuah
          kesalahan.
        </p>

        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/login"
            className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700">
            Masuk / Login
          </Link>

          <Link
            href="/"
            className="inline-flex items-center justify-center px-4 py-2 rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50">
            Kembali ke Beranda
          </Link>
        </div>

        <p className="mt-6 text-xs text-muted-foreground">
          Butuh bantuan?{" "}
          <a className="underline" href="mailto:support@example.com">
            support@example.com
          </a>
        </p>
      </div>
    </main>
  );
}
