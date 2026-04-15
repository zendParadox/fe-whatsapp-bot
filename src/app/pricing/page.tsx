"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Check,
  Sparkles,
  ArrowLeft,
  QrCode,
  ShieldCheck,
  Timer,
  RefreshCw,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import Image from "next/image";

type PageState = "idle" | "loading" | "qris" | "success";

interface QrisData {
  qr_url: string;
  qr_string: string;
  order_id: string;
  amount: number;
  months: number;
  expiry_time: string;
}

export default function PricingPage() {
  const [pageState, setPageState] = useState<PageState>("idle");
  const [selectedMonths, setSelectedMonths] = useState<number>(1);
  const [qrisData, setQrisData] = useState<QrisData | null>(null);
  const [countdown, setCountdown] = useState<number>(0);
  const [backPath, setBackPath] = useState("/");
  const [backLabel, setBackLabel] = useState("Kembali");
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const router = useRouter();

  // Dynamic back navigation based on referrer
  useEffect(() => {
    const ref = document.referrer;
    if (ref) {
      try {
        const url = new URL(ref);
        if (url.pathname.startsWith("/dashboard")) {
          setBackPath("/dashboard");
          setBackLabel("Kembali ke Dashboard");
        } else {
          setBackPath("/");
          setBackLabel("Kembali ke Beranda");
        }
      } catch {
        setBackPath("/");
        setBackLabel("Kembali ke Beranda");
      }
    } else {
      setBackPath("/");
      setBackLabel("Kembali ke Beranda");
    }
  }, []);

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  const getDurationPrice = (months: number) => {
    switch (months) {
      case 1:
        return 15000;
      case 3:
        return 39000;
      case 6:
        return 66000;
      case 12:
        return 108000;
      default:
        return 15000 * months;
    }
  };

  const getPricePerMonth = (months: number) => {
    return Math.floor(getDurationPrice(months) / months);
  };

  // Start polling for payment status
  const startPolling = useCallback((orderId: string) => {
    if (pollingRef.current) clearInterval(pollingRef.current);

    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/subscription/verify?order_id=${orderId}`);
        const data = await res.json();

        if (data.status === "settlement") {
          // Payment confirmed!
          if (pollingRef.current) clearInterval(pollingRef.current);
          if (countdownRef.current) clearInterval(countdownRef.current);
          setPageState("success");
          toast.success("Pembayaran berhasil! 🎉");
        } else if (
          data.status === "expire" ||
          data.status === "cancel" ||
          data.status === "deny"
        ) {
          if (pollingRef.current) clearInterval(pollingRef.current);
          if (countdownRef.current) clearInterval(countdownRef.current);
          toast.error(`Pembayaran ${data.status}. Silakan coba lagi.`);
          setPageState("idle");
          setQrisData(null);
        }
      } catch {
        // Silently continue polling
      }
    }, 3000);
  }, []);

  // Start countdown timer
  const startCountdown = useCallback((expiryTime: string) => {
    if (countdownRef.current) clearInterval(countdownRef.current);

    const updateCountdown = () => {
      const now = Date.now();
      const expiry = new Date(expiryTime).getTime();
      const remaining = Math.max(0, Math.floor((expiry - now) / 1000));
      setCountdown(remaining);

      if (remaining <= 0) {
        if (countdownRef.current) clearInterval(countdownRef.current);
        if (pollingRef.current) clearInterval(pollingRef.current);
        toast.error("QR Code sudah expired. Silakan buat ulang.");
        setPageState("idle");
        setQrisData(null);
      }
    };

    updateCountdown();
    countdownRef.current = setInterval(updateCountdown, 1000);
  }, []);

  // Handle subscribe — create QRIS transaction
  const handleSubscribe = async () => {
    setPageState("loading");

    try {
      const res = await fetch("/api/subscription/qris", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ months: selectedMonths }),
      });

      const data = await res.json();

      if (res.status === 401) {
        toast.error("Silakan login terlebih dahulu untuk berlangganan.");
        router.push("/login?callbackUrl=/pricing");
        return;
      }

      if (!res.ok) throw new Error(data.error || "Gagal membuat transaksi");

      setQrisData(data);
      setPageState("qris");
      startPolling(data.order_id);
      startCountdown(data.expiry_time);
    } catch (err: unknown) {
      console.error(err);
      toast.error(
        err instanceof Error ? err.message : "Gagal membuat transaksi QRIS.",
      );
      setPageState("idle");
    }
  };

  // Cancel and go back
  const handleCancel = () => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    setPageState("idle");
    setQrisData(null);
  };

  // Format countdown as mm:ss
  const formatCountdown = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Countdown progress (0 to 1)
  const countdownProgress = Math.max(0, countdown / (15 * 60));

  return (
    <div className="dark text-foreground min-h-screen bg-background relative overflow-hidden flex flex-col items-center justify-start sm:justify-center py-6 sm:py-12 px-4 sm:px-6 lg:px-8">
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-ai-purple/20 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-ai-cyan/20 blur-[120px]" />

      {/* Dynamic Back Navigation */}
      <div className="absolute top-3 left-3 sm:top-6 sm:left-6 z-10">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="text-muted-foreground hover:text-foreground gap-1.5"
        >
          <Link href={backPath}>
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">{backLabel}</span>
            <span className="sm:hidden">Kembali</span>
          </Link>
        </Button>
      </div>

      {/* SUCCESS STATE */}
      {pageState === "success" && (
        <div className="text-center space-y-6 relative z-10 max-w-lg mx-auto px-4 animate-in fade-in slide-in-from-bottom-4">
          {/* Success ring animation */}
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 mx-auto">
            <div className="absolute inset-0 rounded-full bg-green-500/20 animate-ping" />
            <div className="relative w-full h-full rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/30">
              <Check
                className="w-10 h-10 sm:w-12 sm:h-12 text-white"
                strokeWidth={3}
              />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
            Pembayaran Berhasil!
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base lg:text-lg">
            Selamat! 🎉 Akun Anda telah diupgrade ke{" "}
            <strong className="text-foreground">Premium</strong>. Nikmati semua
            fitur AI tanpa batas.
          </p>
          <Button
            onClick={() => router.push("/dashboard")}
            className="bg-gradient-to-r from-ai-cyan to-ai-purple text-white h-11 sm:h-12 px-6 sm:px-8 shadow-lg"
          >
            Kembali ke Dashboard
          </Button>
        </div>
      )}

      {/* LOADING STATE */}
      {pageState === "loading" && (
        <div className="text-center space-y-6 relative z-10 max-w-lg mx-auto px-4 animate-in fade-in">
          <div className="relative w-20 h-20 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-ai-cyan/20" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-ai-cyan animate-spin" />
            <div className="absolute inset-3 rounded-full bg-background flex items-center justify-center">
              <QrCode className="w-8 h-8 text-ai-cyan animate-pulse" />
            </div>
          </div>
          <p className="text-muted-foreground text-sm sm:text-base">
            Membuat QR Code pembayaran...
          </p>
        </div>
      )}

      {/* QRIS STATE — Show QR Code */}
      {pageState === "qris" && qrisData && (
        <div className="relative z-10 w-full max-w-md mx-auto mt-12 sm:mt-0 animate-in fade-in slide-in-from-bottom-4">
          <Card className="bg-background/80 backdrop-blur border-border overflow-hidden">
            {/* Gradient top accent */}
            <div className="h-1 bg-gradient-to-r from-ai-cyan via-ai-purple to-ai-pink" />

            <CardHeader className="text-center pb-3 px-4 sm:px-6">
              <div className="flex items-center justify-center gap-2 mb-2">
                <ShieldCheck className="w-5 h-5 text-green-500" />
                <span className="text-xs font-semibold text-green-500 uppercase tracking-wider">
                  Pembayaran Aman
                </span>
              </div>
              <CardTitle className="text-lg sm:text-xl">
                Scan QR untuk Bayar
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Gunakan aplikasi e-wallet atau mobile banking yang mendukung
                QRIS.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 px-4 sm:px-6">
              {/* Amount display */}
              <div className="bg-muted/60 p-3 rounded-lg flex justify-between items-center">
                <div>
                  <p className="text-xs text-muted-foreground">
                    Total Tagihan ({qrisData.months} Bulan)
                  </p>
                  <p className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-ai-cyan to-ai-purple bg-clip-text text-transparent">
                    Rp {qrisData.amount.toLocaleString("id-ID")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Per bulan</p>
                  <p className="text-sm font-bold">
                    Rp{" "}
                    {getPricePerMonth(qrisData.months).toLocaleString("id-ID")}
                  </p>
                </div>
              </div>

              {/* QR Code with animated border */}
              <div className="relative flex items-center justify-center">
                {/* Animated gradient ring */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-ai-cyan via-ai-purple to-ai-pink p-[2px] animate-pulse">
                  <div className="w-full h-full rounded-2xl bg-background" />
                </div>

                <div className="relative bg-white rounded-xl p-4 m-[3px] w-full aspect-square max-w-[280px] mx-auto flex items-center justify-center">
                  {qrisData.qr_url ? (
                    <Image
                      src={qrisData.qr_url}
                      alt="QRIS QR Code"
                      width={260}
                      height={260}
                      className="w-full h-full object-contain"
                      unoptimized
                    />
                  ) : (
                    <div className="text-center text-muted-foreground space-y-2">
                      <QrCode className="w-16 h-16 mx-auto opacity-30" />
                      <p className="text-xs">QR code tidak tersedia</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Countdown Timer */}
              <div className="flex items-center justify-center gap-3 py-2">
                <div className="relative w-10 h-10">
                  {/* Background circle */}
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 40 40">
                    <circle
                      cx="20"
                      cy="20"
                      r="16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      className="text-muted/30"
                    />
                    <circle
                      cx="20"
                      cy="20"
                      r="16"
                      fill="none"
                      stroke="url(#timerGradient)"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeDasharray={`${countdownProgress * 100.53} 100.53`}
                      className="transition-all duration-1000 ease-linear"
                    />
                    <defs>
                      <linearGradient
                        id="timerGradient"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="0%"
                      >
                        <stop offset="0%" stopColor="hsl(var(--ai-cyan))" />
                        <stop offset="100%" stopColor="hsl(var(--ai-purple))" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <Timer className="absolute inset-0 m-auto w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p
                    className={`text-lg font-mono font-bold tracking-wider ${countdown <= 60 ? "text-red-500 animate-pulse" : "text-foreground"}`}
                  >
                    {formatCountdown(countdown)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Berlaku hingga expire
                  </p>
                </div>
              </div>

              {/* Supported payment apps */}
              <div className="text-center space-y-1.5 pt-1 border-t border-border/50">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                  Didukung oleh
                </p>
                <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground flex-wrap">
                  {[
                    "GoPay",
                    "OVO",
                    "DANA",
                    "ShopeePay",
                    "LinkAja",
                    "BCA Mobile",
                    "BRI Mobile",
                  ].map((app) => (
                    <span
                      key={app}
                      className="bg-muted/50 rounded-full px-2 py-0.5 text-[10px] sm:text-xs"
                    >
                      {app}
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex gap-3 border-t bg-muted/20 pt-4 pb-4 px-4 sm:px-6">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleCancel}
              >
                Batal
              </Button>
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={handleSubscribe}
              >
                <RefreshCw className="w-4 h-4" />
                Refresh QR
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

      {/* IDLE STATE - Show pricing cards */}
      {pageState === "idle" && (
        <>
          {/* Header */}
          <div className="text-center space-y-3 sm:space-y-4 mb-8 sm:mb-12 mt-10 sm:mt-0 relative z-10 w-full max-w-2xl mx-auto px-2">
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
              Supercharge Keuangan Anda
            </h1>
            <p className="text-muted-foreground text-sm sm:text-lg lg:text-xl max-w-xl mx-auto">
              Aktifkan asisten pintar AI. Biarkan GoTEK otomatis mencatat dan
              menganalisis semua pengeluaran Anda.
            </p>
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/50 text-amber-600 dark:text-amber-400 rounded-full px-3 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold animate-pulse">
              🔥 Promo Terbatas: Diskon 48% untuk 100 Pendaftar Pertama!
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 w-full max-w-4xl relative z-10 px-1">
            {/* FREE PLAN */}
            <Card className="glass-card">
              <CardHeader className="px-4 sm:px-6">
                <CardTitle className="text-xl sm:text-2xl">
                  Biasa (Free)
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Pencatatan manual untuk kebutuhan dasar.
                </CardDescription>
                <div className="mt-3 sm:mt-4 flex items-baseline text-3xl sm:text-4xl font-extrabold">
                  Rp 0
                  <span className="ml-1 text-lg sm:text-xl font-medium text-muted-foreground">
                    /bln
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6">
                <ul className="space-y-2.5 sm:space-y-3">
                  {[
                    "Pencatatan Manual Tak Terbatas",
                    "Format Teks Manual di WhatsApp",
                    "Laporan Standar (Hari/Minggu/Bulan)",
                    "Limit 5 Kategori Budget Bulanan",
                  ].map((feature, i) => (
                    <li key={i} className="flex items-start">
                      <Check className="h-4 w-4 sm:h-5 sm:w-5 text-ai-cyan shrink-0 mt-0.5" />
                      <p className="ml-2.5 text-xs sm:text-sm text-foreground">
                        {feature}
                      </p>
                    </li>
                  ))}
                  {[
                    "Smart AI Parser di Dashboard & WA",
                    "Scan Struk Otomatis (Gambar)",
                    "Laporan Analisis Mendalam AI",
                    "Kantong Keuangan (Bank & E-Wallet)",
                    "Export Laporan PDF & Excel",
                  ].map((feature, i) => (
                    <li
                      key={`disabled-${i}`}
                      className="flex items-start opacity-40"
                    >
                      <div className="h-4 w-4 sm:h-5 sm:w-5 rounded-full border-2 border-muted-foreground flex items-center justify-center shrink-0 mt-0.5">
                        <span className="w-2 h-0.5 bg-muted-foreground rotate-45" />
                      </div>
                      <p className="ml-2.5 text-xs sm:text-sm text-muted-foreground line-through">
                        {feature}
                      </p>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="px-4 sm:px-6">
                <Button
                  className="w-full h-10 sm:h-11"
                  variant="outline"
                  disabled
                >
                  Saat Ini Aktif
                </Button>
              </CardFooter>
            </Card>

            {/* PREMIUM PLAN */}
            <Card className="relative bg-gradient-to-b from-background to-background/50 backdrop-blur border-ai-cyan/50 shadow-2xl shadow-ai-cyan/10 flex flex-col">
              <div className="absolute top-0 right-4 sm:right-0 -translate-y-1/2 sm:translate-x-1/4">
                <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-ai-purple to-ai-pink px-3 sm:px-4 py-1 text-xs sm:text-sm font-semibold tracking-wider text-white shadow-sm uppercase">
                  <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" /> Recommended
                </span>
              </div>
              <CardHeader className="px-4 sm:px-6">
                <CardTitle className="text-xl sm:text-2xl text-ai-cyan">
                  Premium
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Pilih durasi berlangganan. Lebih lama, lebih hemat!
                </CardDescription>

                {/* Duration Selector — responsive grid */}
                <div className="grid grid-cols-4 gap-1.5 sm:gap-2 mt-4">
                  {[1, 3, 6, 12].map((months) => (
                    <button
                      key={months}
                      onClick={() => setSelectedMonths(months)}
                      className={`relative flex flex-col items-center justify-center p-1.5 sm:p-2 rounded-lg border-2 transition-all ${
                        selectedMonths === months
                          ? "border-ai-cyan bg-ai-cyan/10"
                          : "border-border hover:border-ai-cyan/50 hover:bg-muted"
                      }`}
                    >
                      {months === 6 && (
                        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-amber-500 text-amber-950 text-[8px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full whitespace-nowrap shadow-sm">
                          POPULER
                        </span>
                      )}
                      {months === 12 && (
                        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-ai-pink text-white text-[8px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full whitespace-nowrap shadow-sm">
                          TERHEMAT
                        </span>
                      )}
                      <span
                        className={`text-lg sm:text-xl font-bold ${selectedMonths === months ? "text-ai-cyan" : ""}`}
                      >
                        {months}
                      </span>
                      <span className="text-[10px] sm:text-xs text-muted-foreground font-medium">
                        Bulan
                      </span>
                    </button>
                  ))}
                </div>

                {/* Price Display — responsive */}
                <div className="mt-4 sm:mt-6 p-3 sm:p-4 rounded-xl border border-ai-cyan/20 bg-ai-cyan/5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                        Harga Normal
                      </p>
                      <p className="text-sm sm:text-lg font-medium text-muted-foreground line-through decoration-red-500/50">
                        Rp {(29000 * selectedMonths).toLocaleString("id-ID")}
                      </p>
                    </div>
                    {selectedMonths > 1 && (
                      <span className="inline-flex items-center bg-green-500/20 text-green-500 text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full border border-green-500/40 uppercase animate-pulse">
                        Hemat Rp{" "}
                        {(
                          15000 * selectedMonths -
                          getDurationPrice(selectedMonths)
                        ).toLocaleString("id-ID")}
                      </span>
                    )}
                  </div>

                  <div className="mt-2 flex items-end justify-between gap-2">
                    <div className="flex items-baseline text-2xl sm:text-4xl lg:text-5xl font-extrabold bg-gradient-to-r from-ai-cyan to-ai-purple bg-clip-text text-transparent">
                      Rp{" "}
                      {getDurationPrice(selectedMonths).toLocaleString("id-ID")}
                    </div>
                    <div className="text-right flex flex-col shrink-0">
                      <span className="text-xs sm:text-sm font-bold text-foreground">
                        Rp{" "}
                        {getPricePerMonth(selectedMonths).toLocaleString(
                          "id-ID",
                        )}
                      </span>
                      <span className="text-[10px] sm:text-xs text-muted-foreground">
                        / bulan
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 flex-1 px-4 sm:px-6">
                <ul className="space-y-2.5 sm:space-y-3">
                  {[
                    "Semua fitur di akun Biasa",
                    "Unlimited Smart AI Parser di Dashboard & WA",
                    "Kirim Gambar Struk Langsung Dicatat",
                    "Analisis Mendalam & Insight Keuangan Bulanan dari AI",
                    "Kantong Keuangan — Lacak Saldo Bank & E-Wallet",
                    "Export Laporan PDF & Excel",
                    "Kategori Budget Tak Terbatas",
                  ].map((feature, i) => (
                    <li key={i} className="flex items-start">
                      <Check className="h-4 w-4 sm:h-5 sm:w-5 text-ai-purple shrink-0 mt-0.5" />
                      <p className="ml-2.5 text-xs sm:text-sm font-medium text-foreground">
                        {feature}
                      </p>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="mt-auto pt-4 sm:pt-6 px-4 sm:px-6">
                <Button
                  className="w-full bg-gradient-to-r from-ai-cyan to-ai-purple hover:opacity-90 transition-opacity text-white text-sm sm:text-md font-semibold h-12 sm:h-14 shadow-lg shadow-ai-cyan/20 gap-2"
                  onClick={handleSubscribe}
                >
                  <QrCode className="w-5 h-5" />
                  Bayar via QRIS — Rp{" "}
                  {getDurationPrice(selectedMonths).toLocaleString("id-ID")}
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* QRIS trust badges */}
          <div className="mt-8 sm:mt-12 text-center relative z-10 space-y-2">
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <ShieldCheck className="w-4 h-4 text-green-500" />
              <p className="text-xs sm:text-sm">
                Pembayaran diproses aman oleh{" "}
                <strong className="text-foreground">Midtrans</strong>
              </p>
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              Scan QRIS dengan GoPay, OVO, DANA, ShopeePay, LinkAja, atau Mobile
              Banking
            </p>
          </div>
        </>
      )}
    </div>
  );
}
