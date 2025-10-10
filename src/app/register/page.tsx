"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
import { toast } from "sonner"; // BARU: Import toast dari sonner

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  // const [error, setError] = useState<string | null>(null); // DIHAPUS: State error tidak lagi diperlukan

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    const cleanedValue = value.replace(/\D/g, "");

    if (cleanedValue.startsWith("08")) {
      const convertedValue = "62" + cleanedValue.substring(1);
      setPhone(convertedValue);
    } else {
      setPhone(cleanedValue);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phone.startsWith("62")) {
      toast.error("Nomor WhatsApp harus diawali dengan kode negara 62."); // DIUBAH: Gunakan toast untuk error
      return;
    }

    if (password !== confirm) {
      toast.error("Password dan konfirmasi tidak cocok"); // DIUBAH: Gunakan toast untuk error
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, name, phoneNumber: phone, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || "Gagal melakukan pendaftaran"); // DIUBAH: Gunakan toast untuk error
        setLoading(false);
        return;
      }

      // BARU: Tampilkan notifikasi sukses sebelum redirect
      toast.success("Pendaftaran berhasil!", {
        description: "Anda akan segera dialihkan ke halaman dashboard.",
      });

      // Redirect setelah jeda singkat agar user bisa membaca notifikasi
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch (err: any) {
      console.error(err);
      toast.error("Terjadi kesalahan pada jaringan. Silakan coba lagi."); // DIUBAH: Gunakan toast untuk error
    } finally {
      // Pindahkan setLoading(false) dari blok try agar tidak dieksekusi sebelum redirect
      // Biarkan loading sampai halaman berpindah
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Daftar Akun Baru</CardTitle>
          <CardDescription>
            Masukkan detail Anda di bawah untuk membuat akun.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* DIHAPUS: Komponen Alert tidak lagi diperlukan */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nama Lengkap</Label>
              <Input
                id="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="anda@email.com"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Nomor WhatsApp</Label>
              <Input
                id="phone"
                required
                value={phone}
                onChange={handlePhoneChange}
                placeholder="Contoh: 081234567890"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Konfirmasi Password</Label>
              <Input
                id="confirm"
                type="password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                disabled={loading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Mohon Tunggu...
                </>
              ) : (
                "Daftar"
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center text-sm">
          <p>
            Sudah punya akun?&nbsp;
            <Link href="/login" className="font-semibold hover:underline">
              Masuk di sini
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
