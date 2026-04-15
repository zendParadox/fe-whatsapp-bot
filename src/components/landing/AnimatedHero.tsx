"use client";

import Link from "next/link";
import { ArrowRight, Check, ShieldCheck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import Image from "next/image";

export function AnimatedHero() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const container: any = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const item: any = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 200, damping: 20 },
    },
  };

  return (
    <section className="relative pt-24 pb-16 sm:pt-32 sm:pb-24 lg:pt-40 lg:pb-32 px-4 overflow-hidden">
      <div className="container mx-auto max-w-7xl relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          {/* Left Column: Text Content */}
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="text-center lg:text-left"
          >
            <motion.div
              variants={item}
              className="inline-flex items-center rounded-full border border-ai-cyan/30 bg-ai-cyan/10 px-3 py-1 text-sm text-ai-cyan mb-6 backdrop-blur-md shadow-[0_0_15px_rgba(var(--color-ai-cyan),0.2)]"
            >
              <Zap className="h-4 w-4 mr-2 text-ai-cyan animate-pulse" />
              <span className="font-semibold tracking-wide uppercase text-xs">
                Era Baru Pencatatan Keuangan
              </span>
            </motion.div>

            <motion.h1
              variants={item}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter mb-6 leading-[1.1]"
            >
              Pintar. <br className="hidden lg:block" />
              Otomatis. <br className="hidden lg:block" />
              <span className="bg-gradient-to-r from-ai-cyan via-white to-ai-purple bg-clip-text text-transparent text-glow">
                Via WhatsApp.
              </span>
            </motion.h1>

            <motion.p
              variants={item}
              className="max-w-xl mx-auto lg:mx-0 text-base sm:text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed"
            >
              Tinggalkan aplikasi ribet. Ketik pengeluaran dan pemasukan Anda
              seperti mengobrol dengan teman, dan biarkan AI kami mengaturnya
              dalam sekejap.
            </motion.p>

            <motion.div
              variants={item}
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
            >
              <Button
                asChild
                size="lg"
                className="w-full sm:w-auto h-14 px-8 text-lg bg-white text-black hover:bg-neutral-200 transition-all rounded-full font-bold shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:scale-105"
              >
                <Link href="/register">
                  Mulai Sekarang <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="w-full sm:w-auto h-14 px-8 text-lg border-white/20 text-white hover:bg-white/10 rounded-full backdrop-blur-md transition-all hover:border-ai-cyan/50"
              >
                <Link href="/guide">Lihat Demo</Link>
              </Button>
            </motion.div>

            <motion.div
              variants={item}
              className="mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-4 sm:gap-6 text-sm text-zinc-400"
            >
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded-full bg-ai-cyan/20 flex items-center justify-center">
                  <Check className="h-3 w-3 text-ai-cyan" />
                </div>
                <span>Gratis Selamanya</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded-full bg-ai-purple/20 flex items-center justify-center">
                  <ShieldCheck className="h-3 w-3 text-ai-purple" />
                </div>
                <span>Privasi Terjamin</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Column: Hero Interactive Visual (Phone Mockup) */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.2, type: "spring" }}
            className="relative lg:h-[600px] flex items-center justify-center perspective-[1000px]"
          >
            {/* Glow behind phone */}
            <div className="absolute inset-0 bg-gradient-to-tr from-ai-cyan/20 to-ai-purple/20 blur-[100px] rounded-full pointer-events-none" />

            {/* Floating 3D Phone Mockup (Realistic iPhone) */}
            <motion.div
              animate={{
                y: [-10, 10, -10],
                rotateX: [2, -2, 2],
                rotateY: [-5, 5, -5],
              }}
              transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
              className="relative w-[320px] h-[650px] bg-zinc-900 rounded-[3.5rem] shadow-2xl shadow-ai-cyan/20 transform-gpu p-2 border border-zinc-700/50"
            >
              {/* Outer Edge Reflection */}
              <div className="absolute inset-0 rounded-[3.5rem] bg-gradient-to-tr from-white/5 via-transparent to-white/10 pointer-events-none" />
              {/* Hardware Buttons */}
              <div className="absolute -left-[3px] top-32 w-[3px] h-8 bg-zinc-700/80 rounded-l-md shadow-inner" />{" "}
              {/* Mute */}
              <div className="absolute -left-[3px] top-48 w-[3px] h-16 bg-zinc-700/80 rounded-l-md shadow-inner" />{" "}
              {/* Vol Up */}
              <div className="absolute -left-[3px] top-[260px] w-[3px] h-16 bg-zinc-700/80 rounded-l-md shadow-inner" />{" "}
              {/* Vol Down */}
              <div className="absolute -right-[3px] top-56 w-[3px] h-20 bg-zinc-700/80 rounded-r-md shadow-inner" />{" "}
              {/* Power */}
              {/* Inner Screen */}
              <div className="relative w-full h-full bg-[#0b141a] rounded-[3rem] overflow-hidden border-[4px] border-black flex flex-col">
                {/* Dynamic Island */}
                <div className="absolute top-2 inset-x-0 mx-auto w-[120px] h-[32px] bg-black rounded-full z-50 flex items-center justify-between px-3 shadow-[0_0_0_1px_rgba(255,255,255,0.05)_inset]">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#111111] border border-white/10 flex items-center justify-center pt-[1px]">
                    <div className="w-1 h-1 rounded-full bg-blue-900/60" />
                  </div>
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/80 mr-1 shadow-[0_0_5px_rgba(16,185,129,0.5)]" />
                </div>

                {/* Phone Header (WhatsApp Style) */}
                <div className="bg-[#202c33] text-white p-4 pt-12 flex items-center gap-3 relative z-10 shadow-sm border-b border-white/5">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-md">
                    <Image
                      src="/images/gotek.webp"
                      alt="Logo"
                      width={35}
                      height={35}
                      className="w-full h-full object-contain"
                      unoptimized
                    />
                  </div>
                  <div className="flex flex-col">
                    <div className="font-semibold text-[15px] tracking-wide text-[#e9edef]">
                      GoTEK Bot
                    </div>
                    <div className="text-[11px] text-white/60">online</div>
                  </div>
                </div>

                {/* Chat Background Pattern */}
                <div className="absolute inset-0 bg-[#0b141a] z-0" />
                <div className="absolute inset-0 z-0 opacity-5 bg-[url('https://static.whatsapp.net/rsrc.php/v3/yl/r/1s5wBqV3i_P.png')] bg-repeat" />

                {/* Chat Messages */}
                <div className="relative z-10 p-4 flex flex-col gap-3 mt-1 h-full pb-20 overflow-hidden">
                  {/* Initial bot message */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8, x: -20 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-[#202c33] text-[#e9edef] p-3 rounded-2xl rounded-tl-none self-start max-w-[85%] text-[13px] shadow-sm leading-relaxed"
                  >
                    Halo! Saya bot GoTEK. Mau catat apa hari ini? 🚀
                    <div className="text-[9px] text-white/40 text-right mt-1.5 -mb-1">
                      10:41
                    </div>
                  </motion.div>

                  {/* User typing simulation (Sudah dengan 2 centang biru) */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.5 }}
                    className="bg-[#005c4b] text-[#e9edef] p-3 rounded-2xl rounded-tr-none self-end max-w-[85%] text-[13px] shadow-sm relative leading-relaxed"
                  >
                    beli bensin 25k dan makan siang 35k
                    <div className="text-[9px] text-white/50 text-right mt-1.5 -mb-1 flex justify-end items-center gap-1">
                      10:42
                      {/* FIX: 2 Centang Biru Berdempetan */}
                      <div className="flex -space-x-2.5 ">
                        <Check className="w-[14px] h-[14px] text-[#53bdeb]" />
                        <Check className="w-[14px] h-[14px] text-[#53bdeb]" />
                      </div>
                    </div>
                  </motion.div>

                  {/* AI processing indicator (FIX: Dibuat menghilang setelah selesai) */}
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    // Menggunakan keyframes: muncul, diam, lalu menghilang
                    animate={{
                      opacity: [0, 1, 1, 0],
                      height: [0, "auto", "auto", 0],
                    }}
                    transition={{
                      delay: 2.0,
                      duration: 1.2,
                      times: [0, 0.2, 0.8, 1],
                    }}
                    className="self-start text-[11px] text-zinc-400 italic ml-1 flex items-center gap-1 bg-[#202c33]/50 px-3 rounded-full overflow-hidden"
                  >
                    AI sedang mencatat
                    <span className="flex gap-0.5 ml-1">
                      <motion.span
                        animate={{ opacity: [0.4, 1, 0.4], y: [0, -2, 0] }}
                        transition={{ repeat: Infinity, duration: 1.4 }}
                        className="w-1 h-1 bg-zinc-400 rounded-full"
                      />
                      <motion.span
                        animate={{ opacity: [0.4, 1, 0.4], y: [0, -2, 0] }}
                        transition={{
                          repeat: Infinity,
                          duration: 1.4,
                          delay: 0.2,
                        }}
                        className="w-1 h-1 bg-zinc-400 rounded-full"
                      />
                      <motion.span
                        animate={{ opacity: [0.4, 1, 0.4], y: [0, -2, 0] }}
                        transition={{
                          repeat: Infinity,
                          duration: 1.4,
                          delay: 0.4,
                        }}
                        className="w-1 h-1 bg-zinc-400 rounded-full"
                      />
                    </span>
                  </motion.div>

                  {/* Bot Response (Disesuaikan delay-nya agar pas saat typing hilang) */}
                  {/* <motion.div
                    initial={{ opacity: 0, scale: 0.8, x: -20, height: 0 }}
                    animate={{ opacity: 1, scale: 1, x: 0, height: "auto" }}
                    transition={{ delay: 3.2 }} // Menyesuaikan dengan durasi hilangnya typing indicator
                    className="bg-[#202c33] text-[#e9edef] p-3 rounded-2xl rounded-tl-none self-start max-w-[90%] text-[13px] shadow-sm border-l-4 border-[#00a884] relative mt-1"
                  ></motion.div> */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8, x: -20, height: 0 }}
                    animate={{ opacity: 1, scale: 1, x: 0, height: "auto" }}
                    transition={{ delay: 3 }}
                    className="bg-[#202c33] text-[#e9edef] p-3 rounded-2xl rounded-tl-none self-start max-w-[90%] text-[13px] shadow-sm border-l-4 border-[#00a884] relative mt-1"
                  >
                    <div className="font-semibold text-[#00a884] mb-2 flex items-center gap-1 text-[13px]">
                      <Check className="h-3.5 w-3.5" /> 2 Transaksi Sukses!
                    </div>
                    <div className="space-y-1.5 text-[12px] mb-2 text-zinc-200">
                      <div className="flex justify-between items-center gap-5">
                        <span>1. Bensin</span>
                        <span className="font-semibold text-white">
                          Rp 25.000
                        </span>
                      </div>
                      <div className="flex justify-between items-center gap-5">
                        <span>2. Makan Siang</span>
                        <span className="font-semibold text-white">
                          Rp 35.000
                        </span>
                      </div>
                    </div>
                    <div className="border-t border-white/10 pt-2 flex justify-between font-bold text-white mt-3 text-[13px]">
                      <span>Total</span>
                      <span className="text-[#f15c6d]">-Rp 60.000</span>
                    </div>
                    <div className="text-[9px] text-white/40 text-right mt-2 -mb-1">
                      10:42
                    </div>
                  </motion.div>

                  {/* Floating Action / Category Popup */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 3.5, type: "spring" }}
                    className="absolute bottom-10 inset-x-4 bg-[#182229]/90 backdrop-blur-md border border-white/10 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 z-30"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#00a884]/20 flex items-center justify-center shrink-0">
                      <Zap className="h-5 w-5 text-[#00a884]" />
                    </div>
                    <div className="flex-1">
                      <div className="text-[11px] text-zinc-400 font-medium tracking-wide">
                        Bensin & Makan
                      </div>
                      <div className="text-[13px] font-bold text-white">
                        Auto Kategori AI
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Home indicator */}
                <div className="absolute bottom-2 inset-x-0 flex justify-center z-50 pointer-events-none">
                  <div className="w-[100px] h-1.5 bg-white/20 rounded-full" />
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
