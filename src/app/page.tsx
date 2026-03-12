/*eslint-disable*/
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Target,
  ArrowRight,
  Zap,
  CircleAlert,
  Smartphone,
  Sparkles,
  PieChart,
  Wallet,
  Brain,
  Check,
  Landmark,
  FileSpreadsheet,
  ShieldCheck,
  Star,
  Users,
  Lock
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// ... (keep surrounding code same if possible, but I need to do ReplaceFileContent well)

// Fixing the imports first (removing Wallet, MessageSquarePlus, Shield) and then the unescaped chars in the body.
// Since ReplaceFileContent handles a contiguous block, I might need two calls or one big one if they are close.
// Imports are at the top, errors are at lines 214 and 256. They are far apart.
// I'll do two edits.

import { ModeToggle } from "@/components/mode-toggle";

// Components
function AppHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/50 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 md:px-8">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tighter">
          <span className="bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent dark:text-glow">
            GoTEK
          </span>
        </Link>
        <div className="hidden md:flex items-center gap-6">
          <Link href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Fitur
          </Link>
          <Link href="#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Cara Kerja
          </Link>
          <Link href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Harga
          </Link>
          <Link href="/guide" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Panduan
          </Link>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
            <ModeToggle />
          <Button asChild variant="ghost" className="hidden sm:inline-flex hover:bg-accent hover:text-accent-foreground">
            <Link href="/login">Masuk</Link>
          </Button>
          <Button asChild size="sm" className="sm:size-default bg-gradient-to-r from-neon-purple to-neon-pink hover:opacity-90 transition-opacity border-0 shadow-lg dark:shadow-[0_0_20px_rgba(188,19,254,0.3)]">
            <Link href="/register">Daftar</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

function AppFooter() {
  return (
    <footer className="border-t border-border bg-muted/20 py-12">
      <div className="container mx-auto px-4 text-center">
        <div className="mb-8 flex justify-center">
          <span className="text-2xl font-bold bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent">
            GoTEK
          </span>
        </div>
        <p className="text-muted-foreground mb-4">
          Kelola keuangan dengan cara masa depan.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-sm text-muted-foreground mb-4">
          <Link href="/guide" className="text-neon-cyan hover:underline font-medium">
            Panduan Lengkap
          </Link>
          <span className="hidden sm:inline text-border">|</span>
          <Link href="/feedback" className="text-neon-purple hover:underline font-medium">
            Beri Masukan
          </Link>
          <span className="hidden sm:inline text-border">|</span>
          <Link href="/privacy" className="hover:underline">
            Privasi
          </Link>
          <span className="hidden sm:inline text-border">|</span>
          <Link href="/terms" className="hover:underline">
            Syarat
          </Link>
          <span className="hidden sm:inline text-border">|</span>
          <a 
            href="https://t.me/rafliramadhaniii" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-neon-cyan hover:underline font-medium"
          >
            Telegram Support
          </a>
        </div>
        <p className="text-sm text-zinc-500">
          &copy; {new Date().getFullYear()} GoTEK. All rights reserved.
        </p>
      </div>
    </footer>
  );
}







function FaqSection() {
  return (
    <section id="faq" className="py-24 bg-background relative overflow-hidden">
      <div className="absolute top-0 right-0 -z-10 opacity-20 transform translate-x-1/2 -translate-y-1/2">
        <div className="w-[600px] h-[600px] bg-neon-purple rounded-full blur-[120px]" />
      </div>

      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Panduan Penggunaan</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Pilih metode pencatatan yang paling nyaman untuk Anda: Manual yang presisi atau AI yang praktis.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <Tabs defaultValue="manual" className="w-full">
            <div className="flex justify-center mb-8">
              <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="manual">Manual Format</TabsTrigger>
                <TabsTrigger value="ai">AI Natural Language</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="manual" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid gap-6 md:grid-cols-2">
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <ArrowRight className="h-5 w-5 text-neon-cyan" />
                      Pencatatan Transaksi
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Pemasukan</p>
                      <div className="bg-muted p-3 rounded-md font-mono text-sm border border-border">
                        masuk [jumlah] [keterangan] [kategori]
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Contoh: <code>masuk 5jt Gaji Bulanan @gaji</code>
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Pengeluaran</p>
                      <div className="bg-muted p-3 rounded-md font-mono text-sm border border-border">
                        keluar [jumlah] [keterangan] [kategori]
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Contoh: <code>keluar 25k Kopi Susu @jajan</code>
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Wallet className="h-5 w-5 text-neon-purple" />
                      Hutang & Budget
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Catat Hutang</p>
                      <div className="bg-muted p-3 rounded-md font-mono text-sm border border-border">
                        hutang [jumlah] [keterangan] [nama]
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Contoh: <code>hutang 50k Pinjam Uang @Budi</code>
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Set Budget</p>
                      <div className="bg-muted p-3 rounded-md font-mono text-sm border border-border">
                        budget [jumlah] [kategori]
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Contoh: <code>budget 1jt @makan</code>
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 flex items-start gap-3">
                <div className="mt-1">
                  <Zap className="h-5 w-5 text-yellow-500" />
                </div>
                <div>
                  <h4 className="font-bold text-yellow-500 mb-1">Tips Penting</h4>
                  <p className="text-sm text-muted-foreground">
                    Pastikan menggunakan spasi sebagai pemisah. Gunakan simbol <code>@</code> untuk menandai kategori atau nama orang (untuk hutang).
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="ai" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Card className="glass-card border-neon-purple/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-neon-purple" />
                    AI Smart Parser
                  </CardTitle>
                  <CardDescription>
                    Ketik seperti Anda berbicara dengan teman. AI kami akan memilahnya untuk Anda.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex flex-col md:flex-row gap-6 items-center">
                    <div className="flex-1 space-y-4 w-full">
                      <div className="bg-muted p-4 rounded-xl rounded-tl-none border border-border">
                        <p className="text-sm">
                          &quot;Tadi beli bensin 20rb, terus mampir indomaret habis 50rb buat beli snack, sama bayar parkir 2rb&quot;
                        </p>
                      </div>
                      <div className="flex justify-center">
                        <ArrowRight className="h-6 w-6 text-muted-foreground rotate-90 md:rotate-0" />
                      </div>
                      <div className="bg-neon-purple/10 border border-neon-purple/20 p-4 rounded-xl space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <span>Bensin</span>
                          <span className="font-bold">Rp 20.000</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span>Indomaret (Snack)</span>
                          <span className="font-bold">Rp 50.000</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span>Parkir</span>
                          <span className="font-bold">Rp 2.000</span>
                        </div>
                        <div className="border-t border-neon-purple/20 pt-2 mt-2 flex justify-between items-center font-bold">
                          <span>Total Pengeluaran</span>
                          <span className="text-neon-purple">Rp 72.000</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 flex items-start gap-3">
                <div className="mt-1">
                  <CircleAlert className="h-5 w-5 text-yellow-500" />
                </div>
                <div>
                  <h4 className="font-bold text-yellow-500 mb-1">Peringatan!</h4>
                  <p className="text-sm text-muted-foreground">
                    Untuk fitur AI Smart Parser, penggunaan nya masih sangat terbatas. Utamakan menggunakan Manual Format terlebih dahulu.
                  </p>
                </div>
              </div> */}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </section>
  );
}

function FaqAccordionSection() {
  const faqs = [
    {
      question: "Apakah GoTEK ini berbayar?",
      answer: "GoTEK menyediakan paket Gratis dan Premium. Paket Gratis sudah mencakup pencatatan manual tanpa batas. Paket Premium (Rp 15.000/bln) membuka fitur AI Smart Parser, Scan Struk, Kantong Keuangan, Export PDF/Excel, dan Analisis AI bulanan."
    },
    {
      question: "Apa saja fitur Premium?",
      answer: "Premium mencakup: AI Smart Parser (ketik bebas, langsung tercatat), Scan Struk (kirim foto, otomatis tercatat), Kantong Keuangan (lacak saldo bank & e-wallet seperti BCA, Gopay, ShopeePay), Export Laporan PDF & Excel, Analisis Keuangan Bulanan oleh AI, dan Kategori Budget tak terbatas."
    },
    {
      question: "Apa itu Kantong Keuangan?",
      answer: "Kantong Keuangan adalah fitur Premium yang memungkinkan Anda melacak saldo di berbagai rekening bank dan e-wallet (BCA, Mandiri, Gopay, ShopeePay, dll). Saat mencatat transaksi, cukup ketik 'beli makan 20k dari gopay' dan saldo kantong Gopay Anda otomatis terpotong."
    },
    {
      question: "Apakah bisa diexport ke Excel atau PDF?",
      answer: "Bisa! Pengguna Premium dapat mengunduh laporan keuangan dalam format PDF dan Excel langsung dari Dashboard. Laporan mencakup ringkasan pemasukan/pengeluaran dan detail seluruh transaksi."
    },
    {
      question: "Apakah data keuangan saya aman?",
      answer: "Tentu saja. Kami menggunakan enkripsi standar industri untuk menyimpan data Anda. Kami tidak akan membagikan data Anda ke pihak ketiga manapun."
    },
    {
      question: "Bagaimana jika saya lupa password?",
      answer: "Tenang, Anda bisa mereset password melalui fitur 'Lupa Password' di halaman login."
    },
    {
      question: "Apakah ada batasan transaksi?",
      answer: "Tidak ada batasan jumlah transaksi yang bisa Anda catat, baik untuk paket Gratis maupun Premium. Catat sebanyak-banyaknya!"
    }
  ];

  return (
    <section id="faq-accordion" className="py-24 bg-muted/30">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Pertanyaan Umum</h2>
          <p className="text-muted-foreground">
            Jawaban untuk pertanyaan yang sering diajukan.
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-left font-medium text-lg">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground overflow-hidden selection:bg-neon-cyan/20">
      <AppHeader />

      <main className="flex-grow pt-16">
        {/* Floating Background Blobs */}
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-neon-purple/20 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '4s' }} />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-neon-cyan/20 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />
        </div>

        {/* Hero Section */}
        <section className="relative py-16 sm:py-24 md:py-32 lg:py-40 px-4 text-center">
          <div className="container mx-auto max-w-5xl relative z-10">
            <div className="inline-flex items-center rounded-full border border-neon-cyan/30 bg-neon-cyan/5 px-3 py-1 text-sm text-neon-cyan mb-6 sm:mb-8 backdrop-blur-sm">
              <span className="flex h-2 w-2 rounded-full bg-neon-cyan mr-2 animate-pulse"></span>
              Revolutionizing Finance
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight mb-4 sm:mb-6 leading-tight">
              Catat Keuangan <br />
              <span className="bg-gradient-to-r from-neon-cyan via-blue-500 to-neon-purple bg-clip-text text-transparent dark:text-glow-purple">
                Dengan Kekuatan AI
              </span>
            </h1>
            
            <p className="max-w-2xl mx-auto text-base sm:text-lg md:text-xl text-muted-foreground mb-8 sm:mb-10 leading-relaxed px-2">
              Kelola pemasukan, pengeluaran, kantong grup, dan patungan 
              bulanan Anda langsung dari WhatsApp. Cepat, praktis, dan futuristik tanpa perlu unduh aplikasi.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <Button asChild size="lg" className="w-full sm:w-auto h-12 px-8 text-lg bg-foreground text-background hover:bg-foreground/90 transition-colors rounded-full font-bold">
                <Link href="/register">
                  Mulai Sekarang <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="w-full sm:w-auto h-12 px-8 text-lg border-border hover:bg-accent hover:text-accent-foreground rounded-full backdrop-blur-sm">
                <Link href="#how-it-works">Pelajari Cara Kerja</Link>
              </Button>
            </div>
            
            <p className="mt-4 text-sm text-muted-foreground flex items-center justify-center gap-2">
              <Check className="h-4 w-4 text-neon-cyan" /> Gratis selamanya &bull; Tidak perlu kartu kredit
            </p>

            <div className="mt-8 flex items-center justify-center gap-4 text-xs sm:text-sm text-muted-foreground/80">
              <div className="flex items-center gap-1.5 bg-muted/50 px-3 py-1.5 rounded-full border border-border/50">
                <Lock className="w-4 h-4 text-green-500" /> Data Terenkripsi
              </div>
              <div className="flex items-center gap-1.5 bg-muted/50 px-3 py-1.5 rounded-full border border-border/50">
                <ShieldCheck className="w-4 h-4 text-blue-500" /> Privasi Terjaga
              </div>
            </div>
          </div>
        </section>

        {/* Live Stats Counter Section */}
        <section className="py-8 sm:py-12 border-y border-border/50 bg-muted/10 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-neon-cyan/5 via-transparent to-neon-purple/5 opacity-50" />
          <div className="container mx-auto px-4 relative z-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center divide-x divide-border/50">
              <div className="px-4 flex flex-col items-center justify-center">
                <div className="text-3xl sm:text-4xl font-black bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent mb-1">300+</div>
                <div className="text-xs sm:text-sm text-muted-foreground font-medium uppercase tracking-wider">Pengguna Aktif</div>
              </div>
              <div className="px-4 flex flex-col items-center justify-center">
                <div className="text-3xl sm:text-4xl font-black bg-gradient-to-br from-neon-cyan to-blue-500 bg-clip-text text-transparent mb-1">10K+</div>
                <div className="text-xs sm:text-sm text-muted-foreground font-medium uppercase tracking-wider">Transaksi Tercatat</div>
              </div>
              <div className="px-4 flex flex-col items-center justify-center mt-6 md:mt-0">
                <div className="text-3xl sm:text-4xl font-black bg-gradient-to-br from-neon-purple to-pink-500 bg-clip-text text-transparent mb-1">Rp 2M+</div>
                <div className="text-xs sm:text-sm text-muted-foreground font-medium uppercase tracking-wider">Dana Terkelola</div>
              </div>
              <div className="px-4 flex flex-col items-center justify-center mt-6 md:mt-0">
                <div className="text-3xl sm:text-4xl font-black bg-gradient-to-br from-amber-400 to-orange-500 bg-clip-text text-transparent mb-1">99.9%</div>
                <div className="text-xs sm:text-sm text-muted-foreground font-medium uppercase tracking-wider">Server Uptime</div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-16 sm:py-24 relative">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10 sm:mb-16">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">Fitur Masa Depan</h2>
              <p className="text-muted-foreground max-w-xl mx-auto text-sm sm:text-base">
                Semua yang Anda butuhkan untuk mengatur keuangan, dikemas dalam
                antarmuka chat yang familiar.
              </p>
            </div>
            
            {/* Free Features — Row 1 */}
            <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-4">✅ Gratis untuk Semua</p>
            <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 mb-8 sm:mb-10">
              <Card className="glass-card transition-transform duration-300 hover:scale-105 hover:bg-card/70 group">
                <CardHeader>
                  <div className="h-12 w-12 rounded-xl bg-neon-cyan/10 flex items-center justify-center mb-4 group-hover:bg-neon-cyan/20 transition-colors">
                    <PieChart className="h-6 w-6 text-neon-cyan" />
                  </div>
                  <CardTitle className="text-xl">Input Manual via WhatsApp</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Catat pemasukan &amp; pengeluaran langsung dari WhatsApp dengan format simpel.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="p-3 bg-muted rounded-lg text-sm font-mono border border-border text-foreground">
                    <span className="text-muted-foreground">user:</span> keluar 25k kopi susu @jajan <br/>
                    → <span className="text-green-500">✅ Tercatat!</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card transition-transform duration-300 hover:scale-105 hover:bg-card/70 group">
                <CardHeader>
                  <div className="h-12 w-12 rounded-xl bg-neon-purple/10 flex items-center justify-center mb-4 group-hover:bg-neon-purple/20 transition-colors">
                    <Wallet className="h-6 w-6 text-neon-purple" />
                  </div>
                  <CardTitle className="text-xl">Budget Management</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Kelola budget per kategori. Lihat progress real-time dan tetap on track.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="p-3 bg-muted rounded-lg text-sm font-mono border border-border text-foreground">
                    Makan: <span className="text-yellow-500">Rp 350k / 500k (70%)</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card transition-transform duration-300 hover:scale-105 hover:bg-card/70 group">
                <CardHeader>
                  <div className="h-12 w-12 rounded-xl bg-neon-pink/10 flex items-center justify-center mb-4 group-hover:bg-neon-pink/20 transition-colors">
                    <Target className="h-6 w-6 text-neon-pink" />
                  </div>
                  <CardTitle className="text-xl">Dashboard &amp; Laporan</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Lihat ringkasan harian, mingguan, bulanan lengkap dengan grafik di dashboard.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="p-3 bg-muted rounded-lg text-sm font-mono border border-border text-foreground">
                    📊 <span className="text-neon-cyan">Laporan Maret: Rp 2.1jt</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Premium Features — Row 2 */}
            <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-3 sm:mb-4">👑 Fitur Premium</p>
            <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="glass-card transition-transform duration-300 hover:scale-105 hover:bg-card/70 group relative overflow-hidden">
                <div className="absolute top-3 right-3">
                  <span className="text-[10px] font-bold bg-gradient-to-r from-neon-purple to-neon-pink text-white px-2 py-0.5 rounded-full uppercase">Premium</span>
                </div>
                <CardHeader>
                  <div className="h-12 w-12 rounded-xl bg-neon-cyan/10 flex items-center justify-center mb-4 group-hover:bg-neon-cyan/20 transition-colors">
                    <Sparkles className="h-6 w-6 text-neon-cyan" />
                  </div>
                  <CardTitle className="text-lg">AI Smart Parser</CardTitle>
                  <CardDescription className="text-muted-foreground text-xs">
                    Ketik bebas bahasa natural, AI catat otomatis. Multi-transaksi sekaligus.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="p-2.5 bg-muted rounded-lg text-xs font-mono border border-border text-foreground">
                    &quot;beli bensin 15k dan makan 18k&quot; <br/>
                    → <span className="text-green-500">2 transaksi tercatat</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card transition-transform duration-300 hover:scale-105 hover:bg-card/70 group relative overflow-hidden">
                <div className="absolute top-3 right-3">
                  <span className="text-[10px] font-bold bg-gradient-to-r from-neon-purple to-neon-pink text-white px-2 py-0.5 rounded-full uppercase">Premium</span>
                </div>
                <CardHeader>
                  <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center mb-4 group-hover:bg-amber-500/20 transition-colors">
                    <Brain className="h-6 w-6 text-amber-500" />
                  </div>
                  <CardTitle className="text-lg">Scan Struk &amp; AI Analysis</CardTitle>
                  <CardDescription className="text-muted-foreground text-xs">
                    Kirim foto struk, langsung tercatat. Dapatkan insight keuangan bulanan dari AI.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="p-2.5 bg-muted rounded-lg text-xs font-mono border border-border text-foreground">
                    📸 Foto struk → <span className="text-green-500">3 item tercatat</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card transition-transform duration-300 hover:scale-105 hover:bg-card/70 group relative overflow-hidden">
                <div className="absolute top-3 right-3">
                  <span className="text-[10px] font-bold bg-gradient-to-r from-neon-purple to-neon-pink text-white px-2 py-0.5 rounded-full uppercase">Premium</span>
                </div>
                <CardHeader>
                  <div className="h-12 w-12 rounded-xl bg-green-500/10 flex items-center justify-center mb-4 group-hover:bg-green-500/20 transition-colors">
                    <Users className="h-6 w-6 text-green-500" />
                  </div>
                  <CardTitle className="text-lg">Kantong Grup &amp; Patungan</CardTitle>
                  <CardDescription className="text-muted-foreground text-xs">
                    Undang bot ke grup WA. Catat pengeluaran bersama (patungan) tanpa bikin grup berisik. Bot hanya nyahut jika di-tag @gotek.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="p-2.5 bg-muted rounded-lg text-xs font-mono border border-border text-foreground">
                    &quot;patungan 200k @Andi @Budi @gotek&quot; → <span className="text-green-500">✅ Tercatat</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card transition-transform duration-300 hover:scale-105 hover:bg-card/70 group relative overflow-hidden">
                <div className="absolute top-3 right-3">
                  <span className="text-[10px] font-bold bg-gradient-to-r from-neon-purple to-neon-pink text-white px-2 py-0.5 rounded-full uppercase">Premium</span>
                </div>
                <CardHeader>
                  <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4 group-hover:bg-blue-500/20 transition-colors">
                    <FileSpreadsheet className="h-6 w-6 text-blue-500" />
                  </div>
                  <CardTitle className="text-lg">Export PDF &amp; Excel</CardTitle>
                  <CardDescription className="text-muted-foreground text-xs">
                    Unduh laporan keuangan lengkap kapan saja untuk arsip atau bisnis Anda.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="p-2.5 bg-muted rounded-lg text-xs font-mono border border-border text-foreground">
                    📄 <span className="text-blue-500">GoTEK_Laporan.pdf</span> ✅
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-16 sm:py-24 bg-gradient-to-b from-transparent to-black/5 dark:to-black/20">
          <div className="container mx-auto px-4">
             <div className="text-center mb-10 sm:mb-16">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">Cara Kerja</h2>
              <p className="text-muted-foreground text-sm sm:text-base">
                Cukup 3 langkah mudah untuk memulai.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-12 text-center relative">
              {/* Connector Lines (Desktop) */}
              <div className="hidden sm:block absolute top-1/2 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-border to-transparent -translate-y-1/2 -z-10" />

              <div className="relative">
                <div className="w-20 h-20 mx-auto bg-background border border-border rounded-full flex items-center justify-center text-2xl font-bold text-neon-cyan shadow-lg z-10 mb-6">
                  1
                </div>
                <h3 className="text-xl font-bold mb-2">Daftar Akun</h3>
                <p className="text-muted-foreground text-sm px-4">
                  Buat akun gratis Anda melalui website ini dalam hitungan detik.
                </p>
              </div>

              <div className="relative">
                <div className="w-20 h-20 mx-auto bg-background border border-border rounded-full flex items-center justify-center text-2xl font-bold text-neon-purple shadow-lg z-10 mb-6">
                  2
                </div>
                <h3 className="text-xl font-bold mb-2">Hubungkan WhatsApp</h3>
                <p className="text-muted-foreground text-sm px-4">
                  Kirim pesan &apos;Halo&apos; ke bot kami untuk verifikasi.
                </p>
              </div>

              <div className="relative">
                <div className="w-20 h-20 mx-auto bg-background border border-border rounded-full flex items-center justify-center text-2xl font-bold text-neon-pink shadow-lg z-10 mb-6">
                  3
                </div>
                <h3 className="text-xl font-bold mb-2">Mulai Mencatat</h3>
                <p className="text-muted-foreground text-sm px-4">
                  Kirim transaksi Anda di DM, atau undang bot ke Grup WhatsApp lalu tag @gotek.
                </p>
              </div>
            </div>
            
             <div className="mt-20 flex justify-center">
                 <div className="relative p-1 rounded-2xl bg-gradient-to-br from-neon-cyan/50 to-neon-purple/50">
                    <div className="bg-background/90 dark:bg-black/90 p-8 rounded-[14px] max-w-2xl w-full text-left border border-border">
                        <div className="flex items-center gap-3 mb-6 border-b border-border pb-4">
                             <div className="h-3 w-3 rounded-full bg-red-500"/>
                             <div className="h-3 w-3 rounded-full bg-yellow-500"/>
                             <div className="h-3 w-3 rounded-full bg-green-500"/>
                             <span className="text-xs text-muted-foreground ml-2">WhatsApp Bot Preview</span>
                        </div>
                        <div className="space-y-4 font-mono text-sm">
                            <div className="flex gap-4">
                                <div className="bg-muted p-3 rounded-lg rounded-tl-none max-w-[80%]">
                                    Halo! Saya GoTEK Bot. Apa yang ingin kamu catat hari ini?
                                </div>
                            </div>
                             <div className="flex gap-4 justify-end">
                                <div className="bg-neon-cyan/10 text-neon-cyan p-3 rounded-lg rounded-tr-none max-w-[80%] border border-neon-cyan/20">
                                    beli bensin 15k dan makan siang 18k
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="bg-muted p-3 rounded-lg rounded-tl-none max-w-[80%]">
                                    ✅ 2 Transaksi Berhasil!<br/>
                                    <strong>1. Bensin:</strong> Rp 15.000<br/>
                                    <strong>2. Makan Siang:</strong> Rp 18.000<br/>
                                    <br/>
                                    <em>Total: Rp 33.000</em>
                                </div>
                            </div>
                        </div>
                    </div>
                 </div>
              </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="py-16 sm:py-24 bg-gradient-to-t from-background to-muted/20 relative">
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center mb-10 sm:mb-16">
              <div className="inline-flex items-center rounded-full border border-neon-purple/30 bg-neon-purple/5 px-3 py-1 text-sm text-neon-purple mb-4">
                <Star className="h-4 w-4 mr-2 fill-neon-purple text-neon-purple" />
                Dipercaya oleh 300+ Pengguna
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">Apa Kata Mereka?</h2>
              <p className="text-muted-foreground text-sm sm:text-base">
                Kisah sukses mengatur keuangan dengan lebih mudah bersama GoTEK.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {/* Testimonial 1 */}
              <Card className="glass-card hover:border-neon-cyan/50 transition-colors">
                <CardContent className="pt-6">
                  <div className="flex gap-1 mb-4">
                    {[1,2,3,4,5].map(i => <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />)}
                  </div>
                  <blockquote className="text-sm sm:text-base mb-6 text-muted-foreground">
                    &quot;Dulu mager banget nyatet pengeluaran karena aplikasinya ribet. Semenjak ada GoTEK, tinggal chat di WhatsApp pas di kasir, langsung otomatis kecatat!&quot;
                  </blockquote>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src="" alt="Rizky" />
                      <AvatarFallback>RZ</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold text-sm">Rizky Pratama</div>
                      <div className="text-xs text-muted-foreground">Karyawan Swasta</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Testimonial 2 */}
              <Card className="glass-card hover:border-neon-purple/50 transition-colors">
                <CardContent className="pt-6">
                  <div className="flex gap-1 mb-4">
                    {[1,2,3,4,5].map(i => <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />)}
                  </div>
                  <blockquote className="text-sm sm:text-base mb-6 text-muted-foreground">
                    &quot;Fitur AI Parser-nya juara! Aku bisa catat banyak belanjaan sekaligus dengan bahasa biasa. Ringkasan bulanan juga ngebantu banget buat kontrol budget bulanan.&quot;
                  </blockquote>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src="" alt="Nadya" />
                      <AvatarFallback>ND</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold text-sm">Nadya Kusuma</div>
                      <div className="text-xs text-muted-foreground">Freelancer</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Testimonial 3 */}
              <Card className="glass-card hover:border-neon-pink/50 transition-colors">
                <CardContent className="pt-6">
                  <div className="flex gap-1 mb-4">
                    {[1,2,3,4,5].map(i => <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />)}
                  </div>
                  <blockquote className="text-sm sm:text-base mb-6 text-muted-foreground">
                    &quot;Buat patungan sama temen kost jadi super gampang. Tinggal tag nama mereka di grup WhatsApp, GoTEK langsung bagi rinci pembayarannya secara adil.&quot;
                  </blockquote>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src="" alt="Bima" />
                      <AvatarFallback>BM</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold text-sm">Bima Aditya</div>
                      <div className="text-xs text-muted-foreground">Mahasiswa</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>


        {/* Pricing Section */}
        <section id="pricing" className="py-16 sm:py-24 relative">
          <div className="container mx-auto px-4">
            <div className="text-center mb-4">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">Pilih Paket Anda</h2>
              <p className="text-muted-foreground max-w-xl mx-auto text-sm sm:text-base">
                Mulai gratis atau upgrade ke Premium untuk membuka semua fitur AI.
              </p>
            </div>
            <div className="flex justify-center mb-8 sm:mb-12">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/50 text-amber-600 dark:text-amber-400 rounded-full px-4 sm:px-5 py-2 text-xs sm:text-sm font-semibold animate-pulse text-center">
                🔥 Promo Terbatas: Diskon 48% untuk 100 Pendaftar Pertama!
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto">
              {/* FREE PLAN */}
              <Card className="glass-card border-border/50">
                <CardHeader>
                  <CardTitle className="text-2xl">Biasa (Free)</CardTitle>
                  <CardDescription>Pencatatan manual untuk kebutuhan dasar.</CardDescription>
                  <div className="mt-4 flex items-baseline text-4xl font-extrabold">
                    Rp 0
                    <span className="ml-1 text-xl font-medium text-muted-foreground">/bln</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {[
                      "Pencatatan Manual Tak Terbatas",
                      "Format Teks Manual di WhatsApp",
                      "Laporan Standar (Hari/Minggu/Bulan)",
                      "Limit 5 Kategori Budget",
                    ].map((f, i) => (
                      <li key={i} className="flex items-start">
                        <Check className="h-5 w-5 text-neon-cyan flex-shrink-0" />
                        <span className="ml-3 text-sm">{f}</span>
                      </li>
                    ))}
                    {[
                      "Smart AI Parser",
                      "Scan Struk Otomatis",
                      "Analisis AI Bulanan",
                      "Kantong Keuangan",
                      "Export PDF & Excel",
                    ].map((f, i) => (
                      <li key={`d-${i}`} className="flex items-start opacity-40">
                        <div className="h-5 w-5 rounded-full border-2 border-muted-foreground flex-shrink-0" />
                        <span className="ml-3 text-sm text-muted-foreground line-through">{f}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* PREMIUM PLAN */}
              <Card className="glass-card relative border-neon-cyan/50 shadow-2xl shadow-neon-cyan/10">
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4">
                  <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-neon-purple to-neon-pink px-4 py-1 text-sm font-semibold tracking-wider text-white shadow-sm uppercase">
                    <Sparkles className="w-4 h-4" /> Recommended
                  </span>
                </div>
                <CardHeader>
                  <CardTitle className="text-2xl text-neon-cyan">Premium</CardTitle>
                  <CardDescription>Analisis dan efisiensi maksimum dengan AI.</CardDescription>
                  <div className="mt-4 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-medium text-muted-foreground line-through">Rp 29.000</span>
                      <span className="inline-flex items-center bg-red-500/20 text-red-500 text-xs font-bold px-2 py-0.5 rounded-full border border-red-500/40 uppercase">-48%</span>
                    </div>
                    <div className="flex items-baseline text-4xl font-extrabold bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent">
                      Rp 15.000
                      <span className="ml-1 text-xl font-medium text-muted-foreground">/bln</span>
                    </div>
                    <p className="text-xs text-amber-500 font-medium">⏳ Harga khusus 100 pendaftar pertama</p>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {[
                      "Semua fitur di akun Biasa",
                      "Unlimited Smart AI Parser",
                      "Kirim Gambar Struk Langsung Dicatat",
                      "Analisis & Insight Keuangan Bulanan AI",
                      "Kantong Keuangan (Bank & E-Wallet)",
                      "Export Laporan PDF & Excel",
                      "Kategori Budget Tak Terbatas",
                    ].map((f, i) => (
                      <li key={i} className="flex items-start">
                        <Check className="h-5 w-5 text-neon-purple flex-shrink-0" />
                        <span className="ml-3 text-sm font-medium">{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Button asChild className="w-full mt-6 bg-gradient-to-r from-neon-cyan to-neon-purple hover:opacity-90 transition-opacity text-white font-semibold h-12">
                    <Link href="/pricing">
                      Upgrade Sekarang <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <FaqSection />
        <FaqAccordionSection />
      </main>

      <AppFooter />
    </div>
  );
}
