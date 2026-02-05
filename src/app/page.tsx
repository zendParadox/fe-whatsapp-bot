/*eslint-disable*/
import Link from "next/link";
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
  Smartphone,
  Sparkles,
  PieChart,
  Wallet,
  Brain,
} from "lucide-react";

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
      <div className="container mx-auto flex h-16 items-center justify-between px-6 md:px-8">
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
        </div>
        <div className="flex items-center gap-3">
            <ModeToggle />
          <Button asChild variant="ghost" className="hidden sm:inline-flex hover:bg-accent hover:text-accent-foreground">
            <Link href="/login">Masuk</Link>
          </Button>
          <Button asChild className="bg-gradient-to-r from-neon-purple to-neon-pink hover:opacity-90 transition-opacity border-0 shadow-lg dark:shadow-[0_0_20px_rgba(188,19,254,0.3)]">
            <Link href="/register">Daftar Sekarang</Link>
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
        <p className="text-sm text-muted-foreground mb-4">
          Jika ada kendala, hubungi{" "}
          <a 
            href="https://t.me/rafliramadhaniii" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-neon-cyan hover:underline font-medium"
          >
            Telegram Support
          </a>
        </p>
        <p className="text-sm text-zinc-500">
          &copy; {new Date().getFullYear()} GoTEK. All rights reserved.
        </p>
      </div>
    </footer>
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
        <section className="relative py-24 md:py-32 lg:py-40 px-4 text-center">
          <div className="container mx-auto max-w-5xl relative z-10">
            <div className="inline-flex items-center rounded-full border border-neon-cyan/30 bg-neon-cyan/5 px-3 py-1 text-sm text-neon-cyan mb-8 backdrop-blur-sm">
              <span className="flex h-2 w-2 rounded-full bg-neon-cyan mr-2 animate-pulse"></span>
              Revolutionizing Finance
            </div>
            
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
              Catat Keuangan <br />
              <span className="bg-gradient-to-r from-neon-cyan via-blue-500 to-neon-purple bg-clip-text text-transparent dark:text-glow-purple">
                Dengan Kekuatan AI
              </span>
            </h1>
            
            <p className="max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground mb-10 leading-relaxed">
              Kelola pemasukan, pengeluaran, dan budget bulanan Anda langsung
              dari WhatsApp. Cepat, praktis, dan futuristik.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild size="lg" className="h-12 px-8 text-lg bg-foreground text-background hover:bg-foreground/90 transition-colors rounded-full font-bold">
                <Link href="/register">
                  Mulai Sekarang <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 px-8 text-lg border-border hover:bg-accent hover:text-accent-foreground rounded-full backdrop-blur-sm">
                <Link href="#how-it-works">Pelajari Cara Kerja</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 relative">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Fitur Masa Depan</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Semua yang Anda butuhkan untuk mengatur keuangan, dikemas dalam
                antarmuka chat yang familiar.
              </p>
            </div>
            
            <div className="grid gap-8 md:grid-cols-3">
              <Card className="glass-card transition-transform duration-300 hover:scale-105 hover:bg-card/70 group">
                <CardHeader>
                  <div className="h-12 w-12 rounded-xl bg-neon-cyan/10 flex items-center justify-center mb-4 group-hover:bg-neon-cyan/20 transition-colors">
                    <Sparkles className="h-6 w-6 text-neon-cyan" />
                  </div>
                  <CardTitle className="text-xl">Multi-Transaction AI</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Didukung oleh <strong>Gemini AI</strong>. Ketik beberapa transaksi sekaligus, kami yang urus sisanya.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="p-3 bg-muted rounded-lg text-sm font-mono border border-border text-foreground">
                    &quot;beli bensin 15k dan makan siang 18k&quot; <br/>
                    → <span className="text-green-500">2 transaksi tercatat</span>
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
                    <Brain className="h-6 w-6 text-neon-pink" />
                  </div>
                  <CardTitle className="text-xl">AI Financial Analysis</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Dapatkan insight keuangan bulanan dari Gemini AI secara otomatis.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="p-3 bg-muted rounded-lg text-sm font-mono border border-border text-foreground">
                    <span className="text-neon-cyan">"Pengeluaran food naik 15%..."</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-24 bg-gradient-to-b from-transparent to-black/5 dark:to-black/20">
          <div className="container mx-auto px-4">
             <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Cara Kerja</h2>
              <p className="text-muted-foreground">
                Cukup 3 langkah mudah untuk memulai.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-12 text-center relative">
              {/* Connector Lines (Desktop) */}
              <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-border to-transparent -translate-y-1/2 -z-10" />

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
                  Kirim transaksi Anda dan bot akan mencatatnya secara otomatis.
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
      </main>

      <AppFooter />
    </div>
  );
}
