"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { ArrowLeft, Loader2, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [phoneNumber, setPhoneNumber] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const phone = searchParams.get("phone");
    if (phone) {
      setPhoneNumber(phone);
    }
  }, [searchParams]);

  const handleTokenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setToken(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (token.length !== 6) {
      toast.error("Kode verifikasi harus 6 digit.");
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password minimal 6 karakter.");
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Password dan konfirmasi password tidak cocok.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, token, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Terjadi kesalahan. Coba lagi.");
        setLoading(false);
        return;
      }

      toast.success("Password berhasil diubah!", {
        description: "Silakan login dengan password baru Anda.",
      });

      setTimeout(() => {
        router.push("/login");
      }, 2000);
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
          <Link href="/forgot-password" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            <span>Kembali</span>
          </Link>
        </Button>

        <Card className="w-full shadow-lg border-0 bg-card/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
              <ShieldCheck className="h-6 w-6 text-green-500" />
            </div>
            <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
            <CardDescription className="text-muted-foreground">
              Masukkan kode yang dikirim ke WhatsApp dan password baru Anda.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Hidden phone field for context */}
              {phoneNumber && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Kode dikirim ke: <span className="font-medium text-foreground">{phoneNumber}</span>
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="token">Kode Verifikasi (6 digit)</Label>
                <Input
                  id="token"
                  type="text"
                  inputMode="numeric"
                  value={token}
                  onChange={handleTokenChange}
                  placeholder="Masukkan 6 digit kode"
                  required
                  disabled={loading}
                  className="text-center text-2xl tracking-[0.1em] font-mono transition-all focus:ring-2 focus:ring-primary/20"
                  maxLength={6}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">Password Baru</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    required
                    disabled={loading}
                    className="pr-10 transition-all focus:ring-2 focus:ring-primary/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi password baru"
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
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    Ubah Password
                  </>
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col gap-3 pt-2">
            <p className="text-xs text-muted-foreground text-center">
              Tidak menerima kode?{" "}
              <Link
                href="/forgot-password"
                className="text-primary hover:underline font-medium"
              >
                Kirim ulang
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
