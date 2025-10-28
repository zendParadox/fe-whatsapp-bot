"use client";

import React, { useEffect, useState } from "react";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

/**
 * Props:
 *  - variant: 'full' | 'icon'  -> full: ikon + teks (desktop), icon: icon-only (mobile FAB)
 *  - className?: tambahan className
 *  - id?: id HTML (opsional)
 */
export default function LogoutButton({
  variant = "full",
  className = "",
  id,
}: {
  variant?: "full" | "icon";
  className?: string;
  id?: string;
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // untuk animasi muncul pada versi icon (FAB)
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // sedikit delay supaya animasinya terasa halus saat masuk page
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);

  async function doLogout() {
    try {
      setIsProcessing(true);

      // panggil endpoint logout (sesuaikan endpoint backendmu jika berbeda)
      // gunakan same-origin agar cookie yang ada dikirim
      const res = await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
      });

      // jika backend tidak punya endpoint, fallback: redirect langsung
      if (!res.ok && res.status !== 404) {
        const text = await res.text().catch(() => null);
        console.error("Logout failed:", res.status, text);
        alert("Gagal logout. Cek console.");
        return;
      }

      // redirect ke halaman login / landing
      router.push("/login");
    } catch (err) {
      console.error("Logout error:", err);
      alert("Terjadi kesalahan saat logout.");
    } finally {
      setIsProcessing(false);
    }
  }

  // tombol "visual" untuk full / icon
  const content =
    variant === "full" ? (
      <Button
        variant="ghost"
        className={`inline-flex items-center gap-2 ${className}`}
        id={id}
        title="Logout">
        <LogOut className="h-4 w-4" />
        Keluar
      </Button>
    ) : (
      // icon-only FAB style
      <button
        id={id}
        type="button"
        aria-label="Logout"
        className={`
          p-2 rounded-full shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
          transition-transform transition-opacity duration-300
          ${mounted ? "opacity-100 scale-100" : "opacity-0 scale-75"}
          ${className}
        `}>
        <LogOut className="h-5 w-5 text-red-600" />
      </button>
    );

  return (
    <AlertDialog open={isOpen} onOpenChange={(v) => setIsOpen(v)}>
      <AlertDialogTrigger asChild>{content}</AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Konfirmasi Logout</AlertDialogTitle>
        </AlertDialogHeader>

        <div className="mt-2">
          <p className="text-sm text-muted-foreground">
            Apakah Anda yakin ingin keluar dari akun ini?
          </p>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <AlertDialogCancel asChild>
            <Button variant="outline">Batal</Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              variant="destructive"
              onClick={doLogout}
              disabled={isProcessing}>
              {isProcessing ? "Proses..." : "Keluar"}
            </Button>
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
