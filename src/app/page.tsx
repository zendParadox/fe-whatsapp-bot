import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Wallet, Target, MessageSquarePlus } from "lucide-react";

// Komponen Header untuk Navigasi
function AppHeader() {
  return (
    <header className="py-4 px-6 md:px-8 border-b">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          {/* <BotMessageSquare className="h-7 w-7 text-primary" /> */}
          <span>GoTEK</span>
        </Link>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/login">Masuk</Link>
          </Button>
          <Button asChild>
            <Link href="/register">Daftar Sekarang</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

// Komponen Footer
function AppFooter() {
  return (
    <footer className="py-6 text-center text-sm text-muted-foreground">
      <p>&copy; {new Date().getFullYear()} GoTEK. All rights reserved.</p>
    </footer>
  );
}

// Komponen Utama Halaman
export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader />

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="py-20 md:py-32 text-center bg-gradient-to-b from-white to-gray-50 dark:from-background dark:to-slate-900/20">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
              Catat Keuangan Semudah Chatting
            </h1>
            <p className="max-w-2xl mx-auto text-lg text-muted-foreground mb-8">
              Kelola pemasukan, pengeluaran, dan budget bulanan Anda langsung
              dari WhatsApp. Cepat, praktis, dan selalu ada di genggaman.
            </p>
            <Button asChild size="lg">
              <Link href="/register">Mulai Gratis</Link>
            </Button>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 md:py-24 bg-white dark:bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold">Bagaimana Cara Kerjanya?</h2>
              <p className="text-muted-foreground mt-2">
                Cukup kirim pesan ke bot kami dengan format sederhana.
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Wallet className="h-6 w-6 text-primary" />
                    <span>Catat Transaksi Instan</span>
                  </CardTitle>
                  <CardDescription>
                    Catat pemasukan atau pengeluaran kapan saja, di mana saja.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="font-semibold mb-2">Gunakan format:</p>
                  <pre className="p-3 bg-slate-100 dark:bg-slate-800 rounded-md text-sm overflow-x-auto">
                    <code>
                      masuk/keluar {"<jumlah>"} [deskripsi] {"@<kategori>"}{" "}
                      {"#<metode>"}
                    </code>
                  </pre>
                  <p className="text-xs text-muted-foreground mt-2">
                    Contoh:{" "}
                    <code className="bg-slate-100 dark:bg-slate-800 p-1 rounded">
                      keluar 25000 kopi @minuman #gopay
                    </code>
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Target className="h-6 w-6 text-primary" />
                    <span>Atur Budget Bulanan</span>
                  </CardTitle>
                  <CardDescription>
                    Kendalikan pengeluaran Anda dengan mengatur budget per
                    kategori.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="font-semibold mb-2">Gunakan format:</p>
                  <pre className="p-3 bg-slate-100 dark:bg-slate-800 rounded-md text-sm overflow-x-auto">
                    <code>
                      budget {"<jumlah>"} {"@<kategori>"}
                    </code>
                  </pre>
                  <p className="text-xs text-muted-foreground mt-2">
                    Contoh:{" "}
                    <code className="bg-slate-100 dark:bg-slate-800 p-1 rounded">
                      budget 750000 @transportasi
                    </code>
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <MessageSquarePlus className="h-6 w-6 text-primary" />
                    <span>Perintah Sederhana</span>
                  </CardTitle>
                  <CardDescription>
                    Lupa formatnya? Cukup ketik `bantuan` atau `help` untuk
                    melihat semua perintah.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="font-semibold mb-2">Fitur Lainnya:</p>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    <li>Kategori dibuat otomatis.</li>
                    <li>Metode pembayaran opsional.</li>
                    <li>Balasan instan untuk setiap transaksi.</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <AppFooter />
    </div>
  );
}
