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
  ArrowLeft,
  ArrowDownUp,
  Receipt,
  BarChart3,
  Target,
  Handshake,
  Undo2,
  Sparkles,
  Camera,
  BookOpen,
  Hash,
  Lightbulb,
  ChevronRight,
  MessageSquare,
} from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Panduan Lengkap GoTEK Bot — Semua Command",
  description:
    "Pelajari semua command GoTEK Bot untuk mencatat keuangan via WhatsApp. Panduan lengkap dengan contoh dan penjelasan detail.",
};

/* ─── tiny reusable pieces ─── */

function CodeBlock({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-muted/80 border border-border rounded-lg px-4 py-3 font-mono text-sm leading-relaxed select-all">
      {children}
    </div>
  );
}

function ExampleBubble({
  user,
  children,
}: {
  user?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`flex ${user ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${
          user
            ? "bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20 rounded-tr-none"
            : "bg-muted border border-border rounded-tl-none"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mt-4">
      <Lightbulb className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
      <p className="text-sm text-muted-foreground">{children}</p>
    </div>
  );
}

function SectionAnchor({ id }: { id: string }) {
  return <div id={id} className="scroll-mt-28" />;
}

/* ─── Table of Contents ─── */

const tocItems = [
  { id: "transaksi", icon: "📝", label: "Catat Transaksi" },
  { id: "multi", icon: "📋", label: "Multi-Transaksi" },
  { id: "laporan", icon: "📊", label: "Laporan Keuangan" },
  { id: "budget", icon: "🎯", label: "Budget / Anggaran" },
  { id: "hutang", icon: "🤝", label: "Hutang & Piutang" },
  { id: "undo", icon: "↩️", label: "Undo / Hapus" },
  { id: "ai", icon: "🤖", label: "AI Smart Parser" },
  { id: "struk", icon: "📸", label: "Scan Struk" },
  { id: "jumlah", icon: "#️⃣", label: "Format Jumlah" },
];

/* ─── Page ─── */

export default function GuidePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground overflow-hidden selection:bg-neon-cyan/20">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/50 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-6 md:px-8">
          <Link
            href="/"
            className="flex items-center gap-2 text-xl font-bold tracking-tighter"
          >
            <span className="bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent dark:text-glow">
              GoTEK
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <ModeToggle />
            <Button
              asChild
              variant="ghost"
              className="hidden sm:inline-flex hover:bg-accent hover:text-accent-foreground"
            >
              <Link href="/login">Masuk</Link>
            </Button>
            <Button
              asChild
              className="bg-gradient-to-r from-neon-purple to-neon-pink hover:opacity-90 transition-opacity border-0 shadow-lg dark:shadow-[0_0_20px_rgba(188,19,254,0.3)]"
            >
              <Link href="/register">Daftar</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-grow pt-16">
        {/* Hero */}
        <section className="relative py-16 md:py-24 px-4 text-center">
          <div className="container mx-auto max-w-4xl relative z-10">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="mb-6 group"
            >
              <Link href="/" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                Kembali ke Beranda
              </Link>
            </Button>

            <div className="inline-flex items-center rounded-full border border-neon-purple/30 bg-neon-purple/5 px-3 py-1 text-sm text-neon-purple mb-6 backdrop-blur-sm">
              <BookOpen className="h-4 w-4 mr-2" />
              Panduan Lengkap
            </div>

            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
              Semua Command{" "}
              <span className="bg-gradient-to-r from-neon-cyan via-blue-500 to-neon-purple bg-clip-text text-transparent">
                GoTEK Bot
              </span>
            </h1>

            <p className="max-w-2xl mx-auto text-lg text-muted-foreground mb-10 leading-relaxed">
              Panduan lengkap cara menggunakan GoTEK Bot via WhatsApp.
              Dijelaskan dengan bahasa yang mudah dipahami beserta contoh lengkap.
            </p>
          </div>
        </section>

        {/* Table of Contents */}
        <section className="pb-12 px-4">
          <div className="container mx-auto max-w-4xl">
            <Card className="glass-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Hash className="h-5 w-5 text-neon-cyan" />
                  Daftar Isi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                  {tocItems.map((item) => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm hover:bg-muted/50 transition-colors group"
                    >
                      <span className="text-lg">{item.icon}</span>
                      <span className="group-hover:text-neon-cyan transition-colors">
                        {item.label}
                      </span>
                      <ChevronRight className="h-3.5 w-3.5 ml-auto text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* ────────────── SECTIONS ────────────── */}
        <div className="container mx-auto max-w-4xl px-4 space-y-10 pb-24">
          {/* 1 — Catat Transaksi */}
          <SectionAnchor id="transaksi" />
          <Card className="glass-card overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-neon-cyan/5 to-transparent border-b border-border">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="h-10 w-10 rounded-xl bg-neon-cyan/10 flex items-center justify-center">
                  <ArrowDownUp className="h-5 w-5 text-neon-cyan" />
                </div>
                1. Catat Transaksi
              </CardTitle>
              <CardDescription>
                Perintah utama untuk mencatat pemasukan dan pengeluaran harian Anda
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {/* Pengeluaran */}
              <div>
                <h3 className="font-bold text-base mb-3">
                  📉 Catat Pengeluaran
                </h3>
                <CodeBlock>
                  keluar [jumlah] [keterangan] @[kategori]
                </CodeBlock>
                <p className="text-sm text-muted-foreground mt-2 mb-3">
                  Command alternatif: <code className="text-neon-cyan">expense</code>, <code className="text-neon-cyan">out</code>
                </p>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    Contoh penggunaan:
                  </p>
                  <div className="space-y-3">
                    <ExampleBubble user>
                      keluar 50k makan siang nasi goreng @makan
                    </ExampleBubble>
                    <ExampleBubble user>
                      keluar 18k beli sabun mandi @kebutuhan pribadi
                    </ExampleBubble>
                    <ExampleBubble user>
                      out 15k parkir kantor @transportasi
                    </ExampleBubble>
                  </div>
                </div>

                <div className="mt-4 bg-muted/30 rounded-lg p-4 space-y-2 text-sm">
                  <p className="font-medium">📝 Penjelasan bagian-bagiannya:</p>
                  <ul className="space-y-1.5 text-muted-foreground">
                    <li>
                      • <code className="text-foreground">keluar</code> → menandakan ini pengeluaran
                    </li>
                    <li>
                      • <code className="text-foreground">50k</code> → jumlah uang (Rp 50.000)
                    </li>
                    <li>
                      • <code className="text-foreground">makan siang nasi goreng</code> → keterangan (boleh berapa kata pun)
                    </li>
                    <li>
                      • <code className="text-foreground">@makan</code> → kategori (pakai simbol @ di depan)
                    </li>
                  </ul>
                </div>
              </div>

              <hr className="border-border" />

              {/* Pemasukan */}
              <div>
                <h3 className="font-bold text-base mb-3">
                  📈 Catat Pemasukan
                </h3>
                <CodeBlock>
                  masuk [jumlah] [keterangan] @[kategori]
                </CodeBlock>
                <p className="text-sm text-muted-foreground mt-2 mb-3">
                  Command alternatif: <code className="text-neon-cyan">income</code>, <code className="text-neon-cyan">in</code>
                </p>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    Contoh penggunaan:
                  </p>
                  <div className="space-y-3">
                    <ExampleBubble user>
                      masuk 5jt gaji bulan februari @pekerjaan
                    </ExampleBubble>
                    <ExampleBubble user>
                      masuk 500k uang freelance desain @kerja sampingan
                    </ExampleBubble>
                    <ExampleBubble user>
                      income 1.5jt bonus tahunan @bonus
                    </ExampleBubble>
                  </div>
                </div>

                <Tip>
                  Kategori bisa berupa <strong>lebih dari 1 kata</strong>! Misalnya: <code>@kebutuhan pribadi</code>, <code>@kerja sampingan</code>, <code>@makan di luar</code>. Semua kata setelah tanda @ dianggap sebagai nama kategori.
                </Tip>
              </div>
            </CardContent>
          </Card>

          {/* 2 — Multi-Transaksi */}
          <SectionAnchor id="multi" />
          <Card className="glass-card overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-neon-purple/5 to-transparent border-b border-border">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="h-10 w-10 rounded-xl bg-neon-purple/10 flex items-center justify-center">
                  <Receipt className="h-5 w-5 text-neon-purple" />
                </div>
                2. Multi-Transaksi (Sekaligus)
              </CardTitle>
              <CardDescription>
                Catat beberapa transaksi dalam satu pesan sekaligus — hemat waktu!
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <p className="text-sm text-muted-foreground">
                Cukup <strong>pisahkan setiap transaksi dengan enter</strong> (baris baru).
                Bot akan memproses semuanya dalam satu kali kirim.
              </p>

              <div className="space-y-3">
                <ExampleBubble user>{`keluar 18k beli sabun @pribadi
keluar 50k makan siang @makan
masuk 100k uang jajan dari mama @bonus
keluar 15k parkir @transportasi`}</ExampleBubble>
                <ExampleBubble>
                  ✅ <strong>4 Transaksi Berhasil!</strong>{"\n"}
                  ➖ Rp 18.000 - beli sabun (pribadi){"\n"}
                  ➖ Rp 50.000 - makan siang (makan){"\n"}
                  ➕ Rp 100.000 - uang jajan dari mama (bonus){"\n"}
                  ➖ Rp 15.000 - parkir (transportasi)
                </ExampleBubble>
              </div>

              <Tip>
                Bisa campur pemasukan dan pengeluaran dalam satu pesan!
                Setiap baris dihitung sebagai transaksi terpisah.
              </Tip>
            </CardContent>
          </Card>

          {/* 3 — Laporan */}
          <SectionAnchor id="laporan" />
          <Card className="glass-card overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-neon-cyan/5 to-transparent border-b border-border">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="h-10 w-10 rounded-xl bg-neon-cyan/10 flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-neon-cyan" />
                </div>
                3. Laporan Keuangan
              </CardTitle>
              <CardDescription>
                Lihat ringkasan keuangan harian, mingguan, atau bulanan
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="bg-muted/30 rounded-lg p-4 text-center space-y-2">
                  <p className="text-2xl">📅</p>
                  <p className="font-bold text-sm">Harian</p>
                  <CodeBlock>laporan hari</CodeBlock>
                  <p className="text-xs text-muted-foreground">
                    Alias: <code>laporan today</code>, <code>laporan harian</code>
                  </p>
                </div>
                <div className="bg-muted/30 rounded-lg p-4 text-center space-y-2">
                  <p className="text-2xl">📆</p>
                  <p className="font-bold text-sm">Mingguan</p>
                  <CodeBlock>laporan minggu</CodeBlock>
                  <p className="text-xs text-muted-foreground">
                    Alias: <code>laporan week</code>, <code>laporan mingguan</code>
                  </p>
                </div>
                <div className="bg-muted/30 rounded-lg p-4 text-center space-y-2">
                  <p className="text-2xl">📊</p>
                  <p className="font-bold text-sm">Bulanan</p>
                  <CodeBlock>laporan bulan</CodeBlock>
                  <p className="text-xs text-muted-foreground">
                    Alias: <code>laporan month</code>, <code>laporan bulanan</code>
                  </p>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                Bisa juga pakai kata <code className="text-neon-cyan">report</code> sebagai pengganti <code>laporan</code>. Contoh: <code>report hari</code>
              </p>

              <div className="space-y-3">
                <p className="text-sm font-medium text-muted-foreground">
                  Contoh respons laporan harian:
                </p>
                <ExampleBubble user>laporan hari</ExampleBubble>
                <ExampleBubble>
                  📊 <strong>Laporan Hari Ini</strong>{"\n"}
                  📅 Selasa, 25 Februari{"\n"}
                  ━━━━━━━━━━━━━━{"\n"}
                  📈 Pemasukan: Rp 100.000{"\n"}
                  📉 Pengeluaran: Rp 83.000{"\n"}
                  ━━━━━━━━━━━━━━{"\n"}
                  💚 Balance: Rp 17.000{"\n"}
                  📝 Total Transaksi: 4 transaksi
                </ExampleBubble>
              </div>

              <Tip>
                Laporan bulanan juga menampilkan <strong>Top 3 Pengeluaran</strong> per kategori,
                sehingga Anda bisa tahu di mana uang paling banyak habis!
              </Tip>
            </CardContent>
          </Card>

          {/* 4 — Budget */}
          <SectionAnchor id="budget" />
          <Card className="glass-card overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-neon-purple/5 to-transparent border-b border-border">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="h-10 w-10 rounded-xl bg-neon-purple/10 flex items-center justify-center">
                  <Target className="h-5 w-5 text-neon-purple" />
                </div>
                4. Budget / Anggaran
              </CardTitle>
              <CardDescription>
                Atur batas pengeluaran per kategori setiap bulan — Go
                TEK akan mengingatkan jika hampir melebihi budget
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div>
                <h3 className="font-bold text-base mb-3">🎯 Set Budget</h3>
                <CodeBlock>budget [jumlah] @[kategori]</CodeBlock>

                <div className="space-y-3 mt-4">
                  <ExampleBubble user>budget 1jt @makan</ExampleBubble>
                  <ExampleBubble>
                    🎯 <strong>Budget Berhasil Diatur!</strong>{"\n"}
                    ━━━━━━━━━━━━━━{"\n"}
                    📂 Kategori: makan{"\n"}
                    💰 Anggaran: Rp 1.000.000{"\n"}
                    📅 Periode: Februari 2026
                  </ExampleBubble>
                </div>

                <div className="space-y-3 mt-4">
                  <p className="text-sm font-medium text-muted-foreground">
                    Contoh lain:
                  </p>
                  <ExampleBubble user>budget 500k @transportasi</ExampleBubble>
                  <ExampleBubble user>budget 2jt @kebutuhan rumah</ExampleBubble>
                </div>
              </div>

              <hr className="border-border" />

              <div>
                <h3 className="font-bold text-base mb-3">📋 Cek Status Budget</h3>
                <CodeBlock>cek budget</CodeBlock>
                <p className="text-sm text-muted-foreground mt-2 mb-3">
                  Alternatif: <code className="text-neon-cyan">cek anggaran</code>
                </p>

                <div className="space-y-3">
                  <ExampleBubble user>cek budget</ExampleBubble>
                  <ExampleBubble>
                    🎯 <strong>Status Budget Februari</strong>{"\n"}
                    ━━━━━━━━━━━━━━{"\n\n"}
                    🟢 <strong>makan</strong>{"\n"}
                    {"   "}▓▓▓▓░░░░░░ 40%{"\n"}
                    {"   "}💸 Terpakai: Rp 400.000{"\n"}
                    {"   "}💰 Sisa: Rp 600.000{"\n\n"}
                    🟡 <strong>transportasi</strong>{"\n"}
                    {"   "}▓▓▓▓▓▓▓▓░░ 85%{"\n"}
                    {"   "}💸 Terpakai: Rp 425.000{"\n"}
                    {"   "}💰 Sisa: Rp 75.000
                  </ExampleBubble>
                </div>

                <Tip>
                  Jika pengeluaran di suatu kategori sudah mendekati 80% dari budget,
                  bot akan otomatis memberikan <strong>peringatan</strong> setiap kali Anda mencatat pengeluaran baru di kategori itu.
                </Tip>
              </div>
            </CardContent>
          </Card>

          {/* 5 — Hutang & Piutang */}
          <SectionAnchor id="hutang" />
          <Card className="glass-card overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-neon-pink/5 to-transparent border-b border-border">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="h-10 w-10 rounded-xl bg-neon-pink/10 flex items-center justify-center">
                  <Handshake className="h-5 w-5 text-neon-pink" />
                </div>
                5. Hutang & Piutang
              </CardTitle>
              <CardDescription>
                Catat uang yang Anda pinjam atau pinjamkan agar tidak lupa
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="bg-red-500/5 border border-red-500/10 rounded-lg p-5 space-y-3">
                  <h3 className="font-bold text-base flex items-center gap-2">
                    🔴 Catat Hutang
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Anda <strong>meminjam uang</strong> dari orang lain
                  </p>
                  <CodeBlock>hutang [jumlah] @[nama] [keterangan]</CodeBlock>
                  <div className="space-y-2 mt-2">
                    <ExampleBubble user>hutang 100k @Budi pinjam modal</ExampleBubble>
                    <ExampleBubble user>hutang 50k @Ani beli pulsa</ExampleBubble>
                  </div>
                </div>

                <div className="bg-green-500/5 border border-green-500/10 rounded-lg p-5 space-y-3">
                  <h3 className="font-bold text-base flex items-center gap-2">
                    🟢 Catat Piutang
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Orang lain <strong>meminjam uang dari Anda</strong>
                  </p>
                  <CodeBlock>piutang [jumlah] @[nama] [keterangan]</CodeBlock>
                  <div className="space-y-2 mt-2">
                    <ExampleBubble user>piutang 200k @Doni bayar makan</ExampleBubble>
                    <ExampleBubble user>piutang 1jt @Rina modal usaha</ExampleBubble>
                  </div>
                </div>
              </div>

              <hr className="border-border" />

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <h3 className="font-bold text-base mb-3">📋 Cek Daftar Hutang/Piutang</h3>
                  <CodeBlock>cek hutang</CodeBlock>
                  <p className="text-sm text-muted-foreground mt-2">
                    Alternatif: <code className="text-neon-cyan">cek piutang</code>
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Menampilkan semua hutang & piutang yang <strong>belum lunas</strong>, lengkap dengan ringkasan total.
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-base mb-3">✅ Tandai Lunas</h3>
                  <CodeBlock>lunas @[nama]</CodeBlock>
                  <p className="text-sm text-muted-foreground mt-2">
                    Alternatif: <code className="text-neon-cyan">bayar @[nama]</code>
                  </p>
                  <div className="space-y-2 mt-3">
                    <ExampleBubble user>lunas @Budi</ExampleBubble>
                    <ExampleBubble>
                      ✅ <strong>LUNAS!</strong>{"\n"}
                      👤 Nama: Budi{"\n"}
                      💰 Total: Rp 100.000{"\n"}
                      🎉 Semua hutang dengan Budi sudah lunas!
                    </ExampleBubble>
                  </div>
                </div>
              </div>

              <Tip>
                Saat menandai lunas, <strong>semua hutang/piutang</strong> aktif dengan nama orang tersebut
                akan ditandai lunas sekaligus. Pastikan penulisan nama sesuai dengan yang dicatat.
              </Tip>
            </CardContent>
          </Card>

          {/* 6 — Undo */}
          <SectionAnchor id="undo" />
          <Card className="glass-card overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-neon-cyan/5 to-transparent border-b border-border">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="h-10 w-10 rounded-xl bg-neon-cyan/10 flex items-center justify-center">
                  <Undo2 className="h-5 w-5 text-neon-cyan" />
                </div>
                6. Undo / Hapus Transaksi
              </CardTitle>
              <CardDescription>
                Salah catat? Langsung batalkan transaksi terakhir
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <CodeBlock>undo</CodeBlock>
              <p className="text-sm text-muted-foreground">
                Command alternatif: <code className="text-neon-cyan">hapus</code>, <code className="text-neon-cyan">batal</code>
              </p>

              <div className="space-y-3">
                <ExampleBubble user>undo</ExampleBubble>
                <ExampleBubble>
                  🗑️ <strong>Transaksi Dihapus!</strong>{"\n"}
                  ━━━━━━━━━━━━━━{"\n"}
                  📉 Tipe: Pengeluaran{"\n"}
                  💰 Nominal: Rp 50.000{"\n"}
                  📂 Kategori: makan{"\n"}
                  📝 Keterangan: makan siang{"\n"}
                  ━━━━━━━━━━━━━━{"\n"}
                  ✅ Transaksi sudah dibatalkan
                </ExampleBubble>
              </div>

              <div className="bg-red-500/5 border border-red-500/10 rounded-lg p-4 text-sm">
                <p className="font-medium text-red-500 mb-1">⚠️ Batasan Penting:</p>
                <ul className="text-muted-foreground space-y-1">
                  <li>• Hanya bisa menghapus <strong>transaksi terakhir</strong></li>
                  <li>• Hanya bisa menghapus transaksi yang dibuat <strong>hari ini</strong></li>
                  <li>• Transaksi yang sudah lewat hari tidak bisa di-undo</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* 7 — AI Smart Parser */}
          <SectionAnchor id="ai" />
          <Card className="glass-card overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-neon-purple/5 to-transparent border-b border-border">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="h-10 w-10 rounded-xl bg-neon-purple/10 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-neon-purple" />
                </div>
                7. AI Smart Parser (Gemini)
              </CardTitle>
              <CardDescription>
                Tidak mau ketik format manual? Tulis gaya bahasa sehari-hari, AI yang parsing!
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <p className="text-sm text-muted-foreground">
                Jika pesan Anda <strong>tidak cocok</strong> dengan format command manual manapun,
                GoTEK Bot akan otomatis mengirim pesan Anda ke <strong>Gemini AI</strong> untuk dianalisis.
                AI akan mencoba mendeteksi transaksi dari kalimat Anda.
              </p>

              <div className="space-y-3">
                <ExampleBubble user>
                  tadi beli bensin 20rb, terus mampir indomaret habis 50rb buat snack, sama bayar parkir 2rb
                </ExampleBubble>
                <ExampleBubble>
                  ✨ <strong>Sistem AI (Gemini)</strong>{"\n\n"}
                  📉 <strong>Transportasi</strong>: Rp 20.000 (beli bensin){"\n"}
                  📉 <strong>Belanja</strong>: Rp 50.000 (indomaret snack){"\n"}
                  📉 <strong>Transportasi</strong>: Rp 2.000 (parkir){"\n\n"}
                  ✅ Berhasil mencatat 3 transaksi.
                </ExampleBubble>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 text-sm">
                <p className="font-medium text-yellow-500 mb-1">⚠️ Catatan Penting tentang AI:</p>
                <ul className="text-muted-foreground space-y-1">
                  <li>• Kuota AI <strong>terbatas per hari</strong> — utamakan format manual jika bisa</li>
                  <li>• AI mungkin salah mendeteksi kategori — bisa Anda koreksi di dashboard</li>
                  <li>• Semakin jelas kalimat Anda, semakin akurat hasilnya</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* 8 — Scan Struk */}
          <SectionAnchor id="struk" />
          <Card className="glass-card overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-neon-pink/5 to-transparent border-b border-border">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="h-10 w-10 rounded-xl bg-neon-pink/10 flex items-center justify-center">
                  <Camera className="h-5 w-5 text-neon-pink" />
                </div>
                8. Scan Struk / Nota (Gambar)
              </CardTitle>
              <CardDescription>
                Foto struk belanja & kirim ke bot — AI akan baca dan catat otomatis!
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="bg-muted/30 rounded-lg p-5 space-y-3 text-sm">
                <p className="font-medium">Cara menggunakan:</p>
                <ol className="space-y-2 text-muted-foreground list-decimal pl-5">
                  <li>Foto struk/nota belanja Anda</li>
                  <li>Kirim gambar tersebut ke GoTEK Bot di WhatsApp</li>
                  <li>AI Gemini akan membaca gambar dan mendeteksi item-item belanja</li>
                  <li>Semua transaksi otomatis tercatat!</li>
                </ol>
              </div>

              <div className="space-y-3">
                <div className="flex justify-end">
                  <div className="max-w-[70%] bg-neon-cyan/10 border border-neon-cyan/20 rounded-2xl rounded-tr-none p-4 text-center">
                    <Camera className="h-12 w-12 mx-auto text-neon-cyan/50 mb-2" />
                    <p className="text-xs text-muted-foreground">📷 [foto struk belanja]</p>
                  </div>
                </div>
                <ExampleBubble>
                  ✨ <strong>Struk Berhasil Diproses!</strong>{"\n\n"}
                  📉 <strong>Belanja</strong>: Rp 45.000 (Indomie 5pcs){"\n"}
                  📉 <strong>Belanja</strong>: Rp 12.000 (Aqua 1.5L){"\n"}
                  📉 <strong>Belanja</strong>: Rp 35.000 (Telur 1kg){"\n\n"}
                  ✅ 3 transaksi dari struk berhasil dicatat.
                </ExampleBubble>
              </div>

              <Tip>
                Pastikan foto struk <strong>jelas dan terang</strong> agar AI bisa membaca dengan akurat.
                Struk yang buram atau terlalu gelap mungkin gagal diproses.
              </Tip>
            </CardContent>
          </Card>

          {/* Format Jumlah */}
          <SectionAnchor id="jumlah" />
          <Card className="glass-card overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-neon-cyan/5 to-neon-purple/5 border-b border-border">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-neon-cyan/10 to-neon-purple/10 flex items-center justify-center">
                  <Hash className="h-5 w-5 text-neon-cyan" />
                </div>
                Panduan Format Jumlah
              </CardTitle>
              <CardDescription>
                GoTEK mendukung berbagai format penulisan jumlah uang
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                        Yang Anda Ketik
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                        Artinya
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                        Penjelasan
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {[
                      ["50k", "Rp 50.000", "k = ribu (kilo)"],
                      ["18k", "Rp 18.000", "k = ribu"],
                      ["500rb", "Rp 500.000", "rb = ribu"],
                      ["1jt", "Rp 1.000.000", "jt = juta"],
                      ["1.5jt", "Rp 1.500.000", "bisa pakai desimal"],
                      ["2,5jt", "Rp 2.500.000", "koma juga boleh"],
                      ["25000", "Rp 25.000", "langsung ketik angka"],
                      ["1500000", "Rp 1.500.000", "angka penuh tanpa titik"],
                    ].map(([input, result, desc]) => (
                      <tr key={input} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-neon-cyan">
                          {input}
                        </td>
                        <td className="py-3 px-4 font-medium">{result}</td>
                        <td className="py-3 px-4 text-muted-foreground">{desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Tip>
                Semua format di atas bisa digunakan di <strong>semua command</strong>:
                transaksi, budget, hutang, dan piutang. Pilih cara penulisan yang paling nyaman untuk Anda!
              </Tip>
            </CardContent>
          </Card>

          {/* Sapaan/Help */}
          <Card className="glass-card border-neon-cyan/20">
            <CardContent className="pt-6 flex flex-col sm:flex-row items-center gap-6">
              <div className="flex-shrink-0">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 flex items-center justify-center">
                  <MessageSquare className="h-8 w-8 text-neon-cyan" />
                </div>
              </div>
              <div className="text-center sm:text-left">
                <h3 className="text-lg font-bold mb-2">
                  Butuh bantuan cepat di WhatsApp?
                </h3>
                <p className="text-sm text-muted-foreground mb-1">
                  Ketik <code className="text-neon-cyan font-bold">hi</code>, <code className="text-neon-cyan font-bold">halo</code>, atau{" "}
                  <code className="text-neon-cyan font-bold">hai</code> untuk menyapa bot.
                </p>
                <p className="text-sm text-muted-foreground mb-1">
                  Ketik <code className="text-neon-purple font-bold">help</code> untuk panduan singkat langsung di WhatsApp.
                </p>
                <p className="text-sm text-muted-foreground">
                  Ketik <code className="text-neon-pink font-bold">penjelasan detail</code>, <code className="text-neon-pink font-bold">tutorial</code>, atau{" "}
                  <code className="text-neon-pink font-bold">panduan</code> untuk panduan lengkap di WhatsApp.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
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
            <Link
              href="/feedback"
              className="text-neon-purple hover:underline font-medium mr-4"
            >
              Beri Masukan
            </Link>
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
    </div>
  );
}
