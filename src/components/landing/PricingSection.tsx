"use client";

import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import Link from "next/link";

export function PricingSection() {
  return (
    <section id="pricing" className="py-24 relative">
      {/* Background flare */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-ai-purple/5 blur-[150px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-6"
        >
          <h2 className="text-3xl md:text-5xl font-black mb-4">
            Investasi Masa Depan
          </h2>
          <p className="text-zinc-400 max-w-xl mx-auto text-base md:text-lg">
            Mulai gratis, atau buka seluruh potensi AI eksklusif untuk gaya
            hidup yang lebih terorganisir.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="flex justify-center mb-12 sm:mb-16"
        >
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 text-amber-500/90 rounded-full px-5 py-2 text-sm font-semibold shadow-[0_0_20px_rgba(245,158,11,0.1)]">
            <span className="relative flex h-2 w-2 mr-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            Promo Terbatas: Diskon 48% untuk 100 Pendaftar Pertama!
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* FREE PLAN */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ type: "spring", stiffness: 100 }}
            className="h-full"
          >
            <Card className="glass-card border-white/5 bg-black/40 h-full flex flex-col hover:border-white/20 transition-all duration-300">
              <CardHeader className="pb-8">
                <div className="text-ai-cyan font-bold tracking-widest uppercase text-xs mb-2">
                  Basic
                </div>
                <CardTitle className="text-3xl font-bold">Manual</CardTitle>
                <div className="mt-4 flex items-baseline text-5xl font-black text-white">
                  Rp 0
                  <span className="ml-2 text-lg font-medium text-zinc-500">
                    /bulan
                  </span>
                </div>
                <CardDescription className="text-zinc-400 mt-2">
                  Untuk kebutuhan pencatatan logikal dasar Anda.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <ul className="space-y-4 mb-8 flex-1">
                  {[
                    "Pencatatan Manual Tak Terbatas",
                    "Format Teks Manual di WhatsApp",
                    "Akses Dashboard Standard",
                    "Laporan Ringkasan",
                    "Maksimal 5 Kategori",
                  ].map((f, i) => (
                    <li
                      key={i}
                      className="flex items-start text-zinc-300 transform transition-transform hover:translate-x-1"
                    >
                      <Check className="h-5 w-5 text-white/50 flex-shrink-0 mr-3" />
                      <span className="text-sm">{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  asChild
                  variant="outline"
                  className="w-full h-12 bg-white/5 border-white/10 hover:bg-white/10 hover:text-white transition-all text-zinc-300"
                >
                  <Link href="/register">Mulai Gratis</Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* PREMIUM PLAN */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ type: "spring", stiffness: 100, delay: 0.1 }}
            className="h-full relative group"
          >
            {/* Animated Laser Border using Before/After */}
            <div className="absolute -inset-[2px] rounded-xl bg-gradient-to-b from-ai-cyan via-transparent to-ai-purple opacity-50 group-hover:opacity-100 blur-[2px] transition-opacity duration-500" />

            <Card className="relative glass-card bg-black h-full flex flex-col z-10 overflow-hidden transform transition-transform duration-500 group-hover:scale-[1.02]">
              <div className="absolute inset-0 bg-gradient-to-br from-ai-cyan/10 via-transparent to-ai-purple/10 pointer-events-none" />

              <div className="absolute top-0 right-0 bg-gradient-to-r from-ai-cyan to-ai-purple text-white text-[10px] font-black uppercase tracking-wider px-4 py-1.5 rounded-bl-xl shadow-lg">
                Recomended
              </div>

              <CardHeader className="pb-8">
                <div className="flex items-center gap-2 mb-2">
                  <div className="text-ai-purple font-bold tracking-widest uppercase text-xs">
                    Premium AI
                  </div>
                  <Sparkles className="w-3 h-3 text-ai-cyan animate-pulse" />
                </div>
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-ai-cyan to-ai-purple bg-clip-text text-transparent">
                  Nexus
                </CardTitle>
                <div className="mt-4">
                  <div className="flex items-baseline text-5xl font-black text-white">
                    Rp 15k
                    <span className="ml-2 text-lg font-medium text-zinc-500">
                      /bulan
                    </span>
                  </div>
                  <div className="text-xs text-zinc-500 mt-2">
                    <span className="line-through decoration-red-500/50">
                      Rp 29.000
                    </span>{" "}
                    (Diskon Early Bird)
                  </div>
                </div>
                <CardDescription className="text-zinc-400 mt-2">
                  Dapatkan kemampuan full AI & analisis tak terbatas.
                </CardDescription>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col">
                <ul className="space-y-4 mb-8 flex-1">
                  {[
                    "Semua di Paket Biasa",
                    "AI Smart Parser Bahasa Natural",
                    "Unlimited Kategori & Kantong Grup",
                    "Scan OCR Struk/Nota via Gambar",
                    "AI Monthly Insight & Analytics",
                    "Export Full Audit (PDF/Excel)",
                    "Customer Support Prioritas",
                  ].map((f, i) => (
                    <li
                      key={i}
                      className="flex items-start text-zinc-200 transform transition-transform hover:translate-x-1"
                    >
                      <Check className="h-5 w-5 text-ai-cyan flex-shrink-0 mr-3" />
                      <span className="text-sm font-medium">{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  asChild
                  className="w-full h-12 bg-white text-black hover:bg-zinc-200 transition-all font-bold shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                >
                  <Link href="/pricing">Upgrade ke Nexus</Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
