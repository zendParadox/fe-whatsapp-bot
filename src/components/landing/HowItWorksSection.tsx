"use client";

import { motion } from "framer-motion";
import { UserPlus, MessageCircle, Sparkles } from "lucide-react";

export function HowItWorksSection() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const container: any = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.3 },
    },
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const item: any = {
    hidden: { opacity: 0, scale: 0.9, y: 30 },
    show: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { type: "spring", stiffness: 200, damping: 20 },
    },
  };

  return (
    <section id="how-it-works" className="py-24 relative overflow-hidden">
      {/* Dynamic Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-ai-cyan/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-black mb-4">
            Cara Kerja Pintar
          </h2>
          <p className="text-zinc-400 text-base md:text-lg max-w-2xl mx-auto">
            Tidak perlu mendownload aplikasi. Tidak perlu login setiap kali.
            Hubungkan ke WhatsApp dan langsung nikmati keajaiban AI kami.
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-8 text-center relative max-w-5xl mx-auto"
        >
          {/* Animated Laser Connector Line for Desktop */}
          <div className="hidden md:block absolute top-[44px] left-[15%] w-[70%] h-[2px] bg-white/5 -z-10">
            <motion.div
              initial={{ scaleX: 0, originX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 1.5, delay: 0.5, ease: "easeInOut" }}
              className="absolute inset-0 bg-gradient-to-r from-ai-cyan via-white to-ai-purple shadow-[0_0_15px_rgba(var(--color-ai-cyan),0.8)]"
            />
          </div>

          <motion.div variants={item} className="relative group">
            <div className="w-[88px] h-[88px] mx-auto bg-black border border-white/10 rounded-full flex items-center justify-center shadow-2xl z-10 mb-6 transition-all duration-300 group-hover:scale-110 group-hover:border-ai-cyan/50 group-hover:shadow-[0_0_30px_rgba(var(--color-ai-cyan),0.3)] position-relative">
              <div className="absolute inset-0 rounded-full bg-ai-cyan/10 scale-0 group-hover:scale-100 transition-transform duration-300 origin-center" />
              <UserPlus className="h-8 w-8 text-zinc-300 group-hover:text-ai-cyan transition-colors z-10" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-white">
              Daftarkan Akun
            </h3>
            <p className="text-zinc-400 text-sm px-2">
              Daftar gratis melalui platform web kami dalam waktu kurang dari
              satu menit.
            </p>
          </motion.div>

          <motion.div variants={item} className="relative group">
            <div className="w-[88px] h-[88px] mx-auto bg-black border border-white/10 rounded-full flex items-center justify-center shadow-2xl z-10 mb-6 transition-all duration-300 group-hover:scale-110 group-hover:border-white/50 group-hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] position-relative">
              <div className="absolute inset-0 rounded-full bg-white/5 scale-0 group-hover:scale-100 transition-transform duration-300 origin-center" />
              <MessageCircle className="h-8 w-8 text-zinc-300 group-hover:text-white transition-colors z-10" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-white">Verifikasi WA</h3>
            <p className="text-zinc-400 text-sm px-2">
              Kirim teks{" "}
              <code className="bg-white/10 px-1 rounded text-white">halo</code>{" "}
              ke nomor WhatsApp resmi Bot GoTEK.
            </p>
          </motion.div>

          <motion.div variants={item} className="relative group">
            <div className="w-[88px] h-[88px] mx-auto bg-black border border-white/10 rounded-full flex items-center justify-center shadow-2xl z-10 mb-6 transition-all duration-300 group-hover:scale-110 group-hover:border-ai-purple/50 group-hover:shadow-[0_0_30px_rgba(var(--color-ai-purple),0.3)] position-relative">
              <div className="absolute inset-0 rounded-full bg-ai-purple/10 scale-0 group-hover:scale-100 transition-transform duration-300 origin-center" />
              <Sparkles className="h-8 w-8 text-zinc-300 group-hover:text-ai-purple transition-colors z-10" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-white">
              Bicara pada Bot
            </h3>
            <p className="text-zinc-400 text-sm px-2">
              Jadikan bot teman ngobrol. Semua akan tercatat seketika.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
