"use client";

import { motion } from "framer-motion";
import {
  PieChart,
  Wallet,
  Target,
  Sparkles,
  Brain,
  Users,
  FileSpreadsheet,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

export function FeaturesSection() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const container: any = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const item: any = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { type: "spring", stiffness: 200, damping: 20 },
    },
  };

  return (
    <section id="features" className="py-20 relative overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-16"
        >
          <div className="inline-flex justify-center items-center px-4 py-1.5 rounded-full border border-white/10 bg-white/5 mb-6 backdrop-blur-sm">
            <span className="text-sm font-semibold tracking-wide uppercase bg-gradient-to-r from-zinc-200 to-zinc-500 bg-clip-text text-transparent">
              Power & Simplicity
            </span>
          </div>
          <h2 className="text-3xl md:text-5xl font-black mb-6">
            Fitur Masa Depan
          </h2>
          <p className="text-zinc-400 max-w-xl mx-auto text-base sm:text-lg">
            Sistem asisten keuangan berbasis AI yang menyatu dengan kebiasaan
            chatting harian Anda.
          </p>
        </motion.div>

        {/* Free Features */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-xs font-bold tracking-widest uppercase text-zinc-500 mb-6 flex items-center gap-4"
        >
          <span className="w-10 h-[1px] bg-zinc-800" />
          Gratis untuk Semua
          <span className="flex-1 h-[1px] bg-gradient-to-r from-zinc-800 to-transparent" />
        </motion.p>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-50px" }}
          className="grid gap-6 grid-cols-1 md:grid-cols-3 mb-16"
        >
          {/* Card 1 */}
          <motion.div variants={item}>
            <Card className="glass-card group h-full hover:-translate-y-2 transition-transform duration-500 hover:shadow-[0_0_30px_rgba(255,255,255,0.05)] border-white/5 bg-black/40 backdrop-blur-md">
              <CardHeader>
                <div className="h-12 w-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 group-hover:bg-white/10 transition-colors">
                  <PieChart className="h-6 w-6 text-zinc-300 group-hover:text-white transition-colors" />
                </div>
                <CardTitle className="text-xl">
                  Manual Format WhatsApp
                </CardTitle>
                <CardDescription className="text-zinc-400">
                  Catat pemasukan &amp; pengeluaran secara terstruktur tanpa
                  perlu buka aplikasi.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-white/8 rounded-xl text-sm font-mono border border-white/5 text-zinc-300">
                  <span className="text-zinc-500">user:</span> keluar 25k kopi
                  susu @jajan <br />→{" "}
                  <span className="text-emerald-400">✅ Tercatat!</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Card 2 */}
          <motion.div variants={item}>
            <Card className="glass-card group h-full hover:-translate-y-2 transition-transform duration-500 hover:shadow-[0_0_30px_rgba(255,255,255,0.05)] border-white/5 bg-black/40 backdrop-blur-md">
              <CardHeader>
                <div className="h-12 w-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 group-hover:bg-white/10 transition-colors">
                  <Wallet className="h-6 w-6 text-zinc-300 group-hover:text-white transition-colors" />
                </div>
                <CardTitle className="text-xl">Budget Management</CardTitle>
                <CardDescription className="text-zinc-400">
                  Peringatan otomatis saat pengeluaran mendekati limit budget
                  bulanan.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-white/8 rounded-xl text-sm font-mono border border-white/5 text-zinc-300">
                  Makan:{" "}
                  <span className="text-amber-400">Rp 350k / 500k (70%)</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Card 3 */}
          <motion.div variants={item}>
            <Card className="glass-card group h-full hover:-translate-y-2 transition-transform duration-500 hover:shadow-[0_0_30px_rgba(255,255,255,0.05)] border-white/5 bg-black/40 backdrop-blur-md">
              <CardHeader>
                <div className="h-12 w-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 group-hover:bg-white/10 transition-colors">
                  <Target className="h-6 w-6 text-zinc-300 group-hover:text-white transition-colors" />
                </div>
                <CardTitle className="text-xl">Web Dashboard</CardTitle>
                <CardDescription className="text-zinc-400">
                  Akses grafik komprehensif harian, mingguan, bulanan via
                  dashboard web modern.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-white/8 rounded-xl text-sm font-mono border border-white/5 text-zinc-300">
                  📊{" "}
                  <span className="text-ai-cyan">Laporan Maret = Rp 2.1jt</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Premium Features */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-xs font-bold tracking-widest uppercase text-ai-purple mb-6 flex items-center gap-4 pt-8"
        >
          <span className="w-10 h-[1px] bg-ai-purple/50" />
          👑 Fitur Premium / AI
          <span className="flex-1 h-[1px] bg-gradient-to-r from-ai-purple/50 to-transparent" />
        </motion.p>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-50px" }}
          className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
        >
          {/* Prem 1 */}
          <motion.div variants={item}>
            <Card className="glass-card transition-all duration-300 group relative overflow-hidden h-full z-10 hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-br from-ai-cyan/5 via-transparent to-ai-purple/5 opacity-0 group-hover:opacity-100 transition-opacity -z-10" />
              <div className="glow-border rounded-xl" />
              <div className="absolute top-4 right-4 h-2 w-2 rounded-full bg-ai-cyan shadow-[0_0_10px_rgba(var(--color-ai-cyan),1)] animate-pulse" />

              <CardHeader>
                <div className="h-12 w-12 rounded-xl bg-ai-cyan/10 border border-ai-cyan/20 flex items-center justify-center mb-4 group-hover:shadow-[0_0_20px_rgba(var(--color-ai-cyan),0.3)] transition-all">
                  <Sparkles className="h-6 w-6 text-ai-cyan" />
                </div>
                <CardTitle className="text-lg">AI Smart Parser</CardTitle>
                <CardDescription className="text-zinc-400 text-xs mt-2">
                  Ketik bebas seperti layaknya curhat, AI akan mencatat otomatis
                  untuk multi-transaksi.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-3 bg-white/8 rounded-xl text-xs font-mono border border-white/5 text-zinc-300">
                  &quot;bbm 15k &amp; mcd 50k&quot; <br />→{" "}
                  <span className="text-ai-cyan">2 tercatat otomatis</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Prem 2 */}
          <motion.div variants={item}>
            <Card className="glass-card transition-all duration-300 group relative overflow-hidden h-full z-10 hover:-translate-y-2">
              <div className="glow-border rounded-xl" />
              <div className="absolute top-4 right-4 h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,1)] animate-pulse" />

              <CardHeader>
                <div className="h-12 w-12 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center mb-4 group-hover:shadow-[0_0_20px_rgba(251,191,36,0.3)] transition-all">
                  <Brain className="h-6 w-6 text-amber-400" />
                </div>
                <CardTitle className="text-lg">Struk &amp; Analisis</CardTitle>
                <CardDescription className="text-zinc-400 text-xs mt-2">
                  Kirim foto struk belanja, biarkan Vision AI mengekstrak
                  nilainya. Dapatkan insight pengeluaran.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-3 bg-white/8 rounded-xl text-xs font-mono border border-white/5 text-zinc-300">
                  📸 Foto dikirim <br />→{" "}
                  <span className="text-amber-400">3 item diekstrak</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Prem 3 */}
          <motion.div variants={item}>
            <Card className="glass-card transition-all duration-300 group relative overflow-hidden h-full z-10 hover:-translate-y-2">
              <div className="glow-border rounded-xl" />
              <div className="absolute top-4 right-4 h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,1)] animate-pulse" />

              <CardHeader>
                <div className="h-12 w-12 rounded-xl bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center mb-4 group-hover:shadow-[0_0_20px_rgba(52,211,153,0.3)] transition-all">
                  <Users className="h-6 w-6 text-emerald-400" />
                </div>
                <CardTitle className="text-lg">Grup Patungan</CardTitle>
                <CardDescription className="text-zinc-400 text-xs mt-2">
                  Undang bot ke grup WA, tag nama untuk otomatis split bill
                  secara matematis presisi tanpa ribut.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-3 bg-white/8 rounded-xl text-xs font-mono border border-white/5 text-zinc-300">
                  &quot;patungan 200k @Andi @Budi&quot; <br />→{" "}
                  <span className="text-emerald-400">Bill dicatat</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Prem 4 */}
          <motion.div variants={item}>
            <Card className="glass-card transition-all duration-300 group relative overflow-hidden h-full z-10 hover:-translate-y-2">
              <div className="glow-border rounded-xl" />
              <div className="absolute top-4 right-4 h-2 w-2 rounded-full bg-ai-purple shadow-[0_0_10px_rgba(var(--color-ai-purple),1)] animate-pulse" />

              <CardHeader>
                <div className="h-12 w-12 rounded-xl bg-ai-purple/10 border border-ai-purple/20 flex items-center justify-center mb-4 group-hover:shadow-[0_0_20px_rgba(var(--color-ai-purple),0.3)] transition-all">
                  <FileSpreadsheet className="h-6 w-6 text-ai-purple" />
                </div>
                <CardTitle className="text-lg">Export Laporan HQ</CardTitle>
                <CardDescription className="text-zinc-400 text-xs mt-2">
                  Unduh ringkasan PDF dan Excel satu bulan penuh untuk review
                  bisnis atau pribadi.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-3 bg-white/8 rounded-xl text-xs font-mono border border-white/5 text-zinc-300">
                  📄 <span className="text-ai-purple">GoTEK_Q1.pdf</span> ✅
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
