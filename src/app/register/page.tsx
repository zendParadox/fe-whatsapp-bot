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
import { ArrowLeft, Loader2, LogIn, UserPlus } from "lucide-react";
import { toast } from "sonner";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
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
      toast.error("Nomor WhatsApp harus diawali dengan kode negara 62.");
      return;
    }

    if (password !== confirm) {
      toast.error("Password dan konfirmasi tidak cocok");
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
        toast.error(data?.error || "Gagal melakukan pendaftaran");
        setLoading(false);
        return;
      }

      toast.success("Pendaftaran berhasil!", {
        description: "Anda akan segera dialihkan ke halaman dashboard.",
      });

      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch (err: unknown) {
      console.error(err);
      toast.error("Terjadi kesalahan pada jaringan. Silakan coba lagi.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-4">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="group transition-all duration-200 hover:bg-primary/10"
        >
          <Link href="/" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            <span>Kembali ke Beranda</span>
          </Link>
        </Button>

        <Card className="w-full shadow-lg border-0 bg-card/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <UserPlus className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">Daftar Akun Baru</CardTitle>
            <CardDescription className="text-muted-foreground">
              Masukkan detail Anda di bawah untuk membuat akun.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
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
                  className="transition-all focus:ring-2 focus:ring-primary/20"
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
                  className="transition-all focus:ring-2 focus:ring-primary/20"
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
                  className="transition-all focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={loading}
                    className="transition-all focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm">Konfirmasi</Label>
                  <Input
                    id="confirm"
                    type="password"
                    required
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="••••••••"
                    disabled={loading}
                    className="transition-all focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
              <Button 
                type="submit" 
                className="w-full font-semibold transition-all duration-200 hover:shadow-md" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Mohon Tunggu...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Daftar Sekarang
                  </>
                )}
              </Button>
            </form>
          </CardContent>
          
          <div className="px-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">atau</span>
              </div>
            </div>
          </div>

          <CardFooter className="flex flex-col gap-3 pt-6">
            <p className="text-sm text-muted-foreground text-center">
              Sudah punya akun?
            </p>
            <Button
              variant="outline"
              asChild
              className="w-full group transition-all duration-200 hover:bg-primary hover:text-primary-foreground hover:border-primary"
            >
              <Link href="/login" className="flex items-center justify-center gap-2">
                <LogIn className="h-4 w-4 transition-transform group-hover:scale-110" />
                <span>Masuk ke Akun</span>
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Dengan mendaftar, Anda menyetujui{" "}
          <Link href="/terms" className="underline hover:text-primary transition-colors">
            Syarat & Ketentuan
          </Link>{" "}
          dan{" "}
          <Link href="/privacy" className="underline hover:text-primary transition-colors">
            Kebijakan Privasi
          </Link>
        </p>
      </div>
    </div>
  );
}
