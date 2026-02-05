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
import { ArrowLeft, Loader2, KeyRound, Send } from "lucide-react";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState("");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!phoneNumber.startsWith("62")) {
      toast.error("Nomor WhatsApp harus diawali dengan kode negara 62.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Terjadi kesalahan. Coba lagi.");
        setLoading(false);
        return;
      }

      toast.success("Kode reset dikirim!", {
        description: "Cek WhatsApp Anda untuk kode verifikasi.",
      });

      // Redirect ke halaman reset password dengan phone number
      setTimeout(() => {
        router.push(`/reset-password?phone=${encodeURIComponent(phoneNumber)}`);
      }, 1500);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Terjadi kesalahan pada jaringan.";
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
          <Link href="/login" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            <span>Kembali ke Login</span>
          </Link>
        </Button>

        <Card className="w-full shadow-lg border-0 bg-card/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <KeyRound className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">Lupa Password?</CardTitle>
            <CardDescription className="text-muted-foreground">
              Masukkan nomor WhatsApp Anda. Kami akan mengirimkan kode verifikasi.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
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
                <p className="text-xs text-muted-foreground">
                  Pastikan nomor WhatsApp terdaftar di akun Anda.
                </p>
              </div>
              <Button
                type="submit"
                className="w-full font-semibold transition-all duration-200 hover:shadow-md"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Mengirim...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Kirim Kode Verifikasi
                  </>
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col gap-3 pt-2">
            <p className="text-sm text-muted-foreground text-center">
              Ingat password Anda?{" "}
              <Link
                href="/login"
                className="text-primary hover:underline font-medium"
              >
                Login
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
