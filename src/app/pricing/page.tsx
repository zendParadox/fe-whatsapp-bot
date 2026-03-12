"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Sparkles, Loader2, ArrowLeft, UploadCloud, Copy } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import Image from "next/image";

type PageState = "idle" | "uploading" | "success";

export default function PricingPage() {
  const [pageState, setPageState] = useState<PageState>("idle");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedMonths, setSelectedMonths] = useState<number>(1);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [backPath, setBackPath] = useState("/");
  const [backLabel, setBackLabel] = useState("Kembali");
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Ukuran file maksimal 5MB");
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Nomor rekening disalin!");
  };

  const handleSubscribe = () => {
    setPageState("uploading");
  };

  const getDurationPrice = (months: number) => {
    switch (months) {
      case 1: return 15000;
      case 3: return 39000;
      case 6: return 66000;
      case 12: return 108000;
      default: return 15000 * months;
    }
  };

  const getPricePerMonth = (months: number) => {
    return Math.floor(getDurationPrice(months) / months);
  };

  const handleSubmitReceipt = async () => {
    if (!selectedFile) return;

    setIsSubmitting(true);
    const amountToPay = getDurationPrice(selectedMonths);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(selectedFile);
      
      reader.onloadend = () => {
        const image = new window.Image();
        image.src = reader.result as string;
        
        image.onload = async () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 1200;

          let width = image.width;
          let height = image.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            toast.error("Gagal mengompres gambar.");
            setIsSubmitting(false);
            return;
          }

          ctx.drawImage(image, 0, 0, width, height);
          const webpBase64 = canvas.toDataURL("image/webp", 0.7);

          try {
            const res = await fetch("/api/subscription/manual", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                amount: amountToPay,
                months: selectedMonths,
                receiptBase64: webpBase64,
              }),
            });

            const data = await res.json();
            
            if (res.status === 401) {
              toast.error("Silakan login terlebih dahulu untuk berlangganan.");
              router.push("/login?callbackUrl=/pricing");
              return;
            }
            
            if (!res.ok) throw new Error(data.error || "Gagal mengunggah bukti");

            setPageState("success");
          } catch (err: unknown) {
            console.error(err);
            toast.error(err instanceof Error ? err.message : "Gagal mengirim bukti pembayaran.");
            setIsSubmitting(false);
          }
        };
      };
    } catch (err: unknown) {
      console.error(err);
      toast.error("Terjadi kesalahan sistem saat kompresi.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col items-center justify-start sm:justify-center py-6 sm:py-12 px-4 sm:px-6 lg:px-8">
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-neon-purple/20 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-neon-cyan/20 blur-[120px]" />

      {/* Dynamic Back Navigation */}
      <div className="absolute top-3 left-3 sm:top-6 sm:left-6 z-10">
        <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground gap-1.5">
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
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
            <Check className="w-8 h-8 sm:w-10 sm:h-10 text-green-500" />
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent">
            Bukti Berhasil Diunggah!
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base lg:text-lg">
            Terima kasih! Pembayaran Anda sedang diproses oleh tim kami. Akun Anda akan otomatis menjadi Premium setelah divalidasi (biasanya 1-5 menit).
          </p>
          <Button 
            onClick={() => router.push("/dashboard")} 
            className="bg-gradient-to-r from-neon-cyan to-neon-purple text-white h-11 sm:h-12 px-6 sm:px-8"
          >
            Kembali ke Dashboard
          </Button>
        </div>
      )}

      {/* UPLOADING STATE (MANUAL PAYMENT) */}
      {pageState === "uploading" && (
        <div className="relative z-10 w-full max-w-lg mx-auto mt-12 sm:mt-0 animate-in fade-in slide-in-from-bottom-4">
          <Card className="bg-background/80 backdrop-blur border-border">
            <CardHeader className="text-center pb-4 border-b px-4 sm:px-6">
              <CardTitle className="text-xl sm:text-2xl">Instruksi Pembayaran</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Transfer sesuai nominal ke rekening berikut untuk aktivasi Premium.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 pt-5 px-4 sm:px-6">
              
              <div className="bg-muted p-3 sm:p-4 rounded-lg flex justify-between items-center">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Total Tagihan ({selectedMonths} Bulan)</p>
                  <p className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent">Rp {getDurationPrice(selectedMonths).toLocaleString("id-ID")}</p>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs sm:text-sm font-semibold">💳 Transfer Rekening Bank</p>
                <div className="border rounded-lg p-3 flex justify-between items-center gap-2">
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Bank BCA</p>
                    <p className="font-mono text-sm sm:text-lg tracking-wider">706-064-6826</p>
                    <p className="text-xs font-medium">a.n. Rafli Ramadhani</p>
                  </div>
                  <Button variant="outline" size="icon" className="shrink-0" onClick={() => copyToClipboard("7060646826")}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>

                <div className="border rounded-lg p-3 flex justify-between items-center gap-2">
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Bank Jago</p>
                    <p className="font-mono text-sm sm:text-lg tracking-wider">5098-3712-3795</p>
                    <p className="text-xs font-medium">a.n. Rafli Ramadhani</p>
                  </div>
                  <Button variant="outline" size="icon" className="shrink-0" onClick={() => copyToClipboard("509837123795")}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                
                <p className="text-xs sm:text-sm font-semibold mt-4">📱 E-Wallet</p>
                <div className="border rounded-lg p-3 flex justify-between items-center gap-2">
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Gopay / ShopeePay / Dana</p>
                    <p className="font-mono text-sm sm:text-lg tracking-wider">0896-3003-2240</p>
                    <p className="text-xs font-medium">a.n. Rafli Ramadhani</p>
                  </div>
                  <Button variant="outline" size="icon" className="shrink-0" onClick={() => copyToClipboard("089630032240")}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-3 pt-5 border-t">
                <p className="text-xs sm:text-sm font-semibold">Upload Bukti Transfer</p>
                
                {!previewUrl ? (
                  <label className="border-2 border-dashed rounded-xl p-6 sm:p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors">
                    <UploadCloud className="w-8 h-8 sm:w-10 sm:h-10 text-muted-foreground mb-2" />
                    <p className="text-xs sm:text-sm font-medium">Klik untuk pilih gambar</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">.JPG, .PNG maksimal 5MB</p>
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                  </label>
                ) : (
                  <div className="relative border rounded-xl overflow-hidden aspect-[4/3] bg-muted flex items-center justify-center">
                    <Image src={previewUrl} alt="Bukti Transfer" fill className="object-contain" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Button variant="secondary" size="sm" onClick={() => { setSelectedFile(null); setPreviewUrl(null); }}>
                        Ganti Gambar
                      </Button>
                    </div>
                  </div>
                )}
              </div>

            </CardContent>
            <CardFooter className="flex gap-3 border-t bg-muted/20 pt-5 px-4 sm:px-6">
              <Button variant="outline" className="flex-1" onClick={() => setPageState("idle")} disabled={isSubmitting}>
                Batal
              </Button>
              <Button 
                className="flex-1 bg-gradient-to-r from-neon-cyan to-neon-purple text-white" 
                disabled={!selectedFile || isSubmitting}
                onClick={handleSubmitReceipt}
              >
                {isSubmitting ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Mengunggah...</>
                ) : (
                  "Kirim Bukti"
                )}
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
              Aktifkan asisten pintar AI. Biarkan GoTEK otomatis mencatat dan menganalisis semua pengeluaran Anda.
            </p>
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/50 text-amber-600 dark:text-amber-400 rounded-full px-3 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold animate-pulse">
              🔥 Promo Terbatas: Diskon 48% untuk 100 Pendaftar Pertama!
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 w-full max-w-4xl relative z-10 px-1">
            {/* FREE PLAN */}
            <Card className="bg-background/50 backdrop-blur border-border/50">
              <CardHeader className="px-4 sm:px-6">
                <CardTitle className="text-xl sm:text-2xl">Biasa (Free)</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Pencatatan manual untuk kebutuhan dasar.</CardDescription>
                <div className="mt-3 sm:mt-4 flex items-baseline text-3xl sm:text-4xl font-extrabold">
                  Rp 0
                  <span className="ml-1 text-lg sm:text-xl font-medium text-muted-foreground">/bln</span>
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
                      <Check className="h-4 w-4 sm:h-5 sm:w-5 text-neon-cyan shrink-0 mt-0.5" />
                      <p className="ml-2.5 text-xs sm:text-sm text-foreground">{feature}</p>
                    </li>
                  ))}
                  {[
                    "Smart AI Parser di Dashboard & WA",
                    "Scan Struk Otomatis (Gambar)",
                    "Laporan Analisis Mendalam AI",
                    "Kantong Keuangan (Bank & E-Wallet)",
                    "Export Laporan PDF & Excel",
                  ].map((feature, i) => (
                    <li key={`disabled-${i}`} className="flex items-start opacity-40">
                      <div className="h-4 w-4 sm:h-5 sm:w-5 rounded-full border-2 border-muted-foreground flex items-center justify-center shrink-0 mt-0.5">
                        <span className="w-2 h-0.5 bg-muted-foreground rotate-45" />
                      </div>
                      <p className="ml-2.5 text-xs sm:text-sm text-muted-foreground line-through">{feature}</p>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="px-4 sm:px-6">
                <Button className="w-full h-10 sm:h-11" variant="outline" disabled>
                  Saat Ini Aktif
                </Button>
              </CardFooter>
            </Card>

            {/* PREMIUM PLAN */}
            <Card className="relative bg-gradient-to-b from-background to-background/50 backdrop-blur border-neon-cyan/50 shadow-2xl shadow-neon-cyan/10 flex flex-col">
              <div className="absolute top-0 right-4 sm:right-0 -translate-y-1/2 sm:translate-x-1/4">
                <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-neon-purple to-neon-pink px-3 sm:px-4 py-1 text-xs sm:text-sm font-semibold tracking-wider text-white shadow-sm uppercase">
                  <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" /> Recommended
                </span>
              </div>
              <CardHeader className="px-4 sm:px-6">
                <CardTitle className="text-xl sm:text-2xl text-neon-cyan">Premium</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Pilih durasi berlangganan. Lebih lama, lebih hemat!</CardDescription>
                
                {/* Duration Selector — responsive grid */}
                <div className="grid grid-cols-4 gap-1.5 sm:gap-2 mt-4">
                  {[1, 3, 6, 12].map((months) => (
                    <button
                      key={months}
                      onClick={() => setSelectedMonths(months)}
                      className={`relative flex flex-col items-center justify-center p-1.5 sm:p-2 rounded-lg border-2 transition-all ${
                        selectedMonths === months 
                          ? "border-neon-cyan bg-neon-cyan/10" 
                          : "border-border hover:border-neon-cyan/50 hover:bg-muted"
                      }`}
                    >
                      {months === 6 && (
                        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-amber-500 text-amber-950 text-[8px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full whitespace-nowrap shadow-sm">
                          POPULER
                        </span>
                      )}
                      {months === 12 && (
                        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-neon-pink text-white text-[8px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full whitespace-nowrap shadow-sm">
                          TERHEMAT
                        </span>
                      )}
                      <span className={`text-lg sm:text-xl font-bold ${selectedMonths === months ? "text-neon-cyan" : ""}`}>{months}</span>
                      <span className="text-[10px] sm:text-xs text-muted-foreground font-medium">Bulan</span>
                    </button>
                  ))}
                </div>

                {/* Price Display — responsive */}
                <div className="mt-4 sm:mt-6 p-3 sm:p-4 rounded-xl border border-neon-cyan/20 bg-neon-cyan/5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-muted-foreground">Harga Normal</p>
                      <p className="text-sm sm:text-lg font-medium text-muted-foreground line-through decoration-red-500/50">
                        Rp {(29000 * selectedMonths).toLocaleString('id-ID')}
                      </p>
                    </div>
                    {selectedMonths > 1 && (
                      <span className="inline-flex items-center bg-green-500/20 text-green-500 text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full border border-green-500/40 uppercase animate-pulse">
                        Hemat Rp {( (15000 * selectedMonths) - getDurationPrice(selectedMonths) ).toLocaleString('id-ID')}
                      </span>
                    )}
                  </div>
                  
                  <div className="mt-2 flex items-end justify-between gap-2">
                    <div className="flex items-baseline text-2xl sm:text-4xl lg:text-5xl font-extrabold bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent">
                      Rp {getDurationPrice(selectedMonths).toLocaleString("id-ID")}
                    </div>
                    <div className="text-right flex flex-col shrink-0">
                      <span className="text-xs sm:text-sm font-bold text-foreground">Rp {getPricePerMonth(selectedMonths).toLocaleString("id-ID")}</span>
                      <span className="text-[10px] sm:text-xs text-muted-foreground">/ bulan</span>
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
                      <Check className="h-4 w-4 sm:h-5 sm:w-5 text-neon-purple shrink-0 mt-0.5" />
                      <p className="ml-2.5 text-xs sm:text-sm font-medium text-foreground">{feature}</p>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="mt-auto pt-4 sm:pt-6 px-4 sm:px-6">
                <Button
                  className="w-full bg-gradient-to-r from-neon-cyan to-neon-purple hover:opacity-90 transition-opacity text-white text-sm sm:text-md font-semibold h-12 sm:h-14 shadow-lg shadow-neon-cyan/20"
                  onClick={handleSubscribe}
                >
                  Bayar Rp {getDurationPrice(selectedMonths).toLocaleString("id-ID")}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
