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

export default function LoginPage() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);



  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const cleanedValue = value.replace(/\D/g, ""); 

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

   
    if (!phoneNumber.startsWith("62") && !phoneNumber.startsWith("61")) {
      toast.error("Nomor WhatsApp harus diawali dengan kode negara 62 (Indonesia) atau 61 (Australia).");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ phoneNumber, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Login gagal, periksa kembali data Anda.");
        setLoading(false); 
        return;
      }

      toast.success("Login berhasil!", {
        description: "Anda akan segera dialihkan ke dashboard.",
      });

      setTimeout(() => {
        router.push("/dashboard");
      }, 1000);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Terjadi kesalahan pada jaringan.";
      toast.error(errorMessage);
      setLoading(false); 
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-4">
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
              <LogIn className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">Login ke Akun Anda</CardTitle>
            <CardDescription className="text-muted-foreground">
              Masukkan nomor WhatsApp dan password Anda.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Nomor WhatsApp</Label>
                <Input
                  id="phone"
                  type="text"
                  value={phoneNumber}
                  onChange={handlePhoneChange}
                  placeholder="Contoh: 081234567890"
                  required
                  disabled={loading}
                  className="transition-all focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link 
                    href="/forgot-password" 
                    className="text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    Lupa password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password Anda"
                  required
                  disabled={loading}
                  className="transition-all focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full font-semibold transition-all duration-200 hover:shadow-md" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    Login
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
              Belum punya akun?
            </p>
            <Button
              variant="outline"
              asChild
              className="w-full group transition-all duration-200 hover:bg-primary hover:text-primary-foreground hover:border-primary"
            >
              <Link href="/register" className="flex items-center justify-center gap-2">
                <UserPlus className="h-4 w-4 transition-transform group-hover:scale-110" />
                <span>Daftar Akun Baru</span>
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Dengan login, Anda menyetujui{" "}
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
