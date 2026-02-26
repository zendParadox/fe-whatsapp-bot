"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Sparkles, Loader2, ArrowLeft, ExternalLink, RefreshCw, PartyPopper } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";

type PageState = "idle" | "creating" | "waiting" | "verifying" | "success" | "failed";

export default function PricingPage() {
  const [pageState, setPageState] = useState<PageState>("idle");
  const [orderId, setOrderId] = useState<string | null>(null);
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);
  const [verifyMessage, setVerifyMessage] = useState<string>("");
  const router = useRouter();

  // Load pending order from sessionStorage on mount
  useEffect(() => {
    const pendingOrder = sessionStorage.getItem("pending_order_id");
    const pendingUrl = sessionStorage.getItem("pending_redirect_url");
    if (pendingOrder) {
      setOrderId(pendingOrder);
      setRedirectUrl(pendingUrl);
      setPageState("waiting");
    }
  }, []);

  const handleSubscribe = async () => {
    setPageState("creating");
    try {
      const res = await fetch("/api/subscription/create", {
        method: "POST",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal membuat order langganan");
      }

      if (data.redirect_url && data.order_id) {
        setOrderId(data.order_id);
        setRedirectUrl(data.redirect_url);
        sessionStorage.setItem("pending_order_id", data.order_id);
        sessionStorage.setItem("pending_redirect_url", data.redirect_url);
        setPageState("waiting");

        // Buka halaman pembayaran Midtrans di tab baru 
        window.open(data.redirect_url, "_blank");
      }
    } catch (err: unknown) {
      console.error(err);
      if (err instanceof Error) {
        toast.error(err.message || "Gagal membuka halaman pembayaran.");
      } else {
        toast.error("Gagal membuka halaman pembayaran.");
      }
      setPageState("idle");
    }
  };

  const handleVerify = useCallback(async () => {
    if (!orderId) return;
    setPageState("verifying");

    try {
      const res = await fetch(`/api/subscription/verify?order_id=${orderId}`);
      const data = await res.json();

      if (data.status === "settlement") {
        setVerifyMessage(data.message || "Pembayaran berhasil!");
        setPageState("success");
        sessionStorage.removeItem("pending_order_id");
        sessionStorage.removeItem("pending_redirect_url");
        toast.success("🎉 Akun Anda sekarang Premium!");
      } else if (data.status === "pending") {
        setVerifyMessage(data.message || "Pembayaran masih menunggu...");
        setPageState("waiting");
        toast.info("Pembayaran belum selesai. Silakan selesaikan pembayaran, lalu tekan Verifikasi lagi.");
      } else {
        setVerifyMessage(data.message || "Pembayaran gagal.");
        setPageState("failed");
        sessionStorage.removeItem("pending_order_id");
        sessionStorage.removeItem("pending_redirect_url");
      }
    } catch (err) {
      console.error(err);
      toast.error("Gagal memverifikasi pembayaran.");
      setPageState("waiting");
    }
  }, [orderId]);

  const handleReset = () => {
    setOrderId(null);
    setRedirectUrl(null);
    setVerifyMessage("");
    setPageState("idle");
    sessionStorage.removeItem("pending_order_id");
    sessionStorage.removeItem("pending_redirect_url");
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-neon-purple/20 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-neon-cyan/20 blur-[120px]" />

      <div className="absolute top-4 left-4 sm:top-8 sm:left-8 z-10">
        <Button variant="ghost" asChild className="text-muted-foreground hover:text-foreground">
          <Link href="/dashboard">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Dashboard
          </Link>
        </Button>
      </div>

      {/* SUCCESS STATE */}
      {pageState === "success" && (
        <div className="text-center space-y-6 relative z-10 max-w-lg mx-auto animate-in fade-in slide-in-from-bottom-4">
          <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
            <PartyPopper className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent">
            Selamat! Anda Premium 🎉
          </h1>
          <p className="text-muted-foreground text-lg">{verifyMessage}</p>
          <Button 
            onClick={() => router.push("/dashboard")} 
            className="bg-gradient-to-r from-neon-cyan to-neon-purple text-white h-12 px-8"
          >
            Mulai Gunakan Premium
          </Button>
        </div>
      )}

      {/* FAILED STATE */}
      {pageState === "failed" && (
        <div className="text-center space-y-6 relative z-10 max-w-lg mx-auto animate-in fade-in slide-in-from-bottom-4">
          <h1 className="text-3xl font-extrabold tracking-tight text-red-500">
            Pembayaran Gagal
          </h1>
          <p className="text-muted-foreground text-lg">{verifyMessage}</p>
          <Button onClick={handleReset} variant="outline">
            Coba Lagi
          </Button>
        </div>
      )}

      {/* WAITING / VERIFYING STATE */}
      {(pageState === "waiting" || pageState === "verifying") && (
        <div className="text-center space-y-6 relative z-10 max-w-lg mx-auto animate-in fade-in slide-in-from-bottom-4">
          <div className="w-16 h-16 rounded-full bg-neon-cyan/20 flex items-center justify-center mx-auto">
            <Sparkles className="w-8 h-8 text-neon-cyan animate-pulse" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Menunggu Pembayaran</h1>
          <p className="text-muted-foreground">
            Silakan selesaikan pembayaran di tab Midtrans yang sudah terbuka.
            Setelah selesai bayar, klik tombol &quot;Verifikasi&quot; di bawah ini.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Button
              onClick={handleVerify}
              disabled={pageState === "verifying"}
              className="bg-gradient-to-r from-neon-cyan to-neon-purple text-white h-12 px-8"
            >
              {pageState === "verifying" ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Memverifikasi...
                </>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5 mr-2" />
                  Verifikasi Pembayaran
                </>
              )}
            </Button>
            {redirectUrl && (
              <Button variant="outline" asChild>
                <a href={redirectUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Buka Halaman Bayar
                </a>
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Order ID: <code className="bg-muted px-1 py-0.5 rounded">{orderId}</code>
          </p>
          <button onClick={handleReset} className="text-xs text-muted-foreground underline hover:text-foreground transition-colors">
            Batal dan mulai ulang
          </button>
        </div>
      )}

      {/* IDLE / CREATING STATE - Show pricing cards */}
      {(pageState === "idle" || pageState === "creating") && (
        <>
          <div className="text-center space-y-4 mb-12 relative z-10 w-full max-w-2xl mx-auto">
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
              Supercharge Keuangan Anda
            </h1>
            <p className="text-muted-foreground text-lg sm:text-xl">
              Aktifkan asisten pintar AI. Biarkan GoTEK otomatis mencatat dan menganalisis semua pengeluaran Anda.
            </p>
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/50 text-amber-600 dark:text-amber-400 rounded-full px-5 py-2 text-sm font-semibold animate-pulse">
              🔥 Promo Terbatas: Diskon 48% untuk 100 Pendaftar Pertama!
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl relative z-10">
            {/* FREE PLAN */}
            <Card className="bg-background/50 backdrop-blur border-border/50">
              <CardHeader>
                <CardTitle className="text-2xl">Biasa (Free)</CardTitle>
                <CardDescription>Pencatatan manual untuk kebutuhan dasar.</CardDescription>
                <div className="mt-4 flex items-baseline text-4xl font-extrabold">
                  Rp 0
                  <span className="ml-1 text-xl font-medium text-muted-foreground">/bln</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {[
                    "Pencatatan Manual Tak Terbatas",
                    "Format Teks Manual di WhatsApp",
                    "Laporan Standar (Hari/Minggu/Bulan)",
                    "Limit 5 Kategori Budget Bulanan",
                  ].map((feature, i) => (
                    <li key={i} className="flex items-start">
                      <div className="flex-shrink-0">
                        <Check className="h-5 w-5 text-neon-cyan" />
                      </div>
                      <p className="ml-3 text-sm text-foreground">{feature}</p>
                    </li>
                  ))}
                  {[
                    "Smart AI Parser di Dashboard & WA",
                    "Scan Struk Otomatis (Gambar)",
                    "Laporan Analisis Mendalam AI",
                  ].map((feature, i) => (
                    <li key={`disabled-${i}`} className="flex items-start opacity-40">
                      <div className="flex-shrink-0">
                        <div className="h-5 w-5 rounded-full border-2 border-muted-foreground flex items-center justify-center">
                          <span className="w-2.5 h-0.5 bg-muted-foreground rotate-45" />
                        </div>
                      </div>
                      <p className="ml-3 text-sm text-muted-foreground line-through">{feature}</p>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full" variant="outline" disabled>
                  Saat Ini Aktif
                </Button>
              </CardFooter>
            </Card>

            {/* PREMIUM PLAN */}
            <Card className="relative bg-gradient-to-b from-background to-background/50 backdrop-blur border-neon-cyan/50 shadow-2xl shadow-neon-cyan/10">
              <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4">
                <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-neon-purple to-neon-pink px-4 py-1 text-sm font-semibold tracking-wider text-white shadow-sm uppercase">
                  <Sparkles className="w-4 h-4" /> Recommended
                </span>
              </div>
              <CardHeader>
                <CardTitle className="text-2xl text-neon-cyan">Premium</CardTitle>
                <CardDescription>Analisis dan efisiensi maksimum dengan kekuatan AI.</CardDescription>
                <div className="mt-4 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-medium text-muted-foreground line-through">Rp 29.000</span>
                    <span className="inline-flex items-center bg-red-500/20 text-red-500 text-xs font-bold px-2 py-0.5 rounded-full border border-red-500/40 uppercase">-48%</span>
                  </div>
                  <div className="flex items-baseline text-4xl font-extrabold bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent">
                    Rp 15.000
                    <span className="ml-1 text-xl font-medium text-muted-foreground">/bln</span>
                  </div>
                  <p className="text-xs text-amber-500 font-medium">⏳ Harga khusus 100 pendaftar pertama — setelahnya kembali Rp 29.000/bln</p>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {[
                    "Semua fitur di akun Biasa",
                    "Unlimited Smart AI Parser di Dashboard & WA",
                    "Kirim Gambar Struk Langsung Dicatat",
                    "Analisis Mendalam & Insight Keuangan Bulanan dari AI",
                    "Kategori Budget Tak Terbatas",
                  ].map((feature, i) => (
                    <li key={i} className="flex items-start">
                      <div className="flex-shrink-0">
                        <Check className="h-5 w-5 text-neon-purple" />
                      </div>
                      <p className="ml-3 text-sm font-medium text-foreground">{feature}</p>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full bg-gradient-to-r from-neon-cyan to-neon-purple hover:opacity-90 transition-opacity text-white text-md font-semibold h-12"
                  onClick={handleSubscribe}
                  disabled={pageState === "creating"}
                >
                  {pageState === "creating" ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    "Upgrade Sekarang"
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
