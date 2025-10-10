/* eslint-disable */ // <-- Sebaiknya dihapus dan perbaiki warning dari linter jika ada
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// Import komponen dari shadcn/ui
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner"; // DIUBAH: Pastikan toast diimpor untuk notifikasi

export default function LoginPage() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  // const [error, setError] = useState(""); // DIHAPUS: Digantikan dengan toast

  // BARU: Handler untuk konversi otomatis nomor telepon
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    const cleanedValue = value.replace(/\D/g, ""); // Hanya terima digit

    if (cleanedValue.startsWith("08")) {
      const convertedValue = "62" + cleanedValue.substring(1);
      setPhoneNumber(convertedValue);
    } else {
      setPhoneNumber(cleanedValue);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // BARU: Validasi awalan nomor telepon
    if (!phoneNumber.startsWith("62")) {
      toast.error("Nomor WhatsApp harus diawali dengan kode negara 62.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // <-- Ini menandakan kita mengandalkan cookie
        body: JSON.stringify({ phoneNumber, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        // DIUBAH: Gunakan toast untuk menampilkan error dari server
        toast.error(data.error || "Login gagal, periksa kembali data Anda.");
        setLoading(false); // Hentikan loading jika gagal
        return;
      }

      // DIHAPUS: Penyimpanan di localStorage tidak lagi diperlukan jika menggunakan HttpOnly cookie
      // localStorage.setItem("user", JSON.stringify(data.user));
      // localStorage.setItem("token", data.token);

      // BARU: Beri notifikasi sukses
      toast.success("Login berhasil!", {
        description: "Anda akan segera dialihkan ke dashboard.",
      });

      // Beri jeda agar notifikasi terbaca sebelum redirect
      setTimeout(() => {
        router.push("/dashboard");
      }, 1000);
    } catch (err: any) {
      // DIUBAH: Gunakan toast untuk error jaringan
      toast.error(err.message || "Terjadi kesalahan pada jaringan.");
      setLoading(false); // Hentikan loading jika ada error
    }
    // DIHAPUS: finally block dihapus agar loading tetap aktif sampai redirect
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Login ke Akun Anda</CardTitle>
          <CardDescription>
            Masukkan nomor WhatsApp dan password Anda.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Nomor WhatsApp</Label>
              <Input
                id="phone"
                type="text"
                value={phoneNumber}
                // DIUBAH: Menggunakan handler baru untuk konversi otomatis
                onChange={handlePhoneChange}
                placeholder="Contoh: 081234567890"
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password Anda"
                required
                disabled={loading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                "Login"
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center text-sm">
          <p>
            Belum punya akun?&nbsp;
            <Link href="/register" className="font-semibold hover:underline">
              Daftar di sini
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
