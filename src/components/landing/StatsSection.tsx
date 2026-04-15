"use client";

import { motion } from "framer-motion";

export function StatsSection() {
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
    hidden: { opacity: 0, filter: "blur(5px)", scale: 0.95 },
    show: { opacity: 1, filter: "blur(0px)", scale: 1, transition: { type: "spring", stiffness: 200, damping: 20 } },
  };

  return (
    <section className="py-12 border-y border-white/5 bg-black/40 relative overflow-hidden backdrop-blur-md">
      <div className="absolute inset-0 bg-gradient-to-r from-ai-cyan/5 via-transparent to-ai-purple/5 opacity-50" />
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-50px" }}
        className="container mx-auto px-4 relative z-10"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center divide-x divide-white/10">
          <motion.div variants={item} className="px-4 flex flex-col items-center justify-center">
            <div className="text-3xl sm:text-4xl font-black bg-gradient-to-b from-white to-white/50 bg-clip-text text-transparent mb-1">300+</div>
            <div className="text-xs sm:text-sm text-zinc-500 font-bold uppercase tracking-widest">Pengguna Aktif</div>
          </motion.div>
          <motion.div variants={item} className="px-4 flex flex-col items-center justify-center">
            <div className="text-3xl sm:text-4xl font-black bg-gradient-to-b from-ai-cyan to-blue-600 bg-clip-text text-transparent mb-1">10K+</div>
            <div className="text-xs sm:text-sm text-zinc-500 font-bold uppercase tracking-widest">Transaksi</div>
          </motion.div>
          <motion.div variants={item} className="px-4 flex flex-col items-center justify-center mt-6 md:mt-0 leading-tight">
            <div className="text-3xl sm:text-4xl font-black bg-gradient-to-b from-ai-purple to-pink-600 bg-clip-text text-transparent mb-1">Rp 2M+</div>
            <div className="text-xs sm:text-sm text-zinc-500 font-bold uppercase tracking-widest mt-1">Volume Tagihan</div>
          </motion.div>
          <motion.div variants={item} className="px-4 flex flex-col items-center justify-center mt-6 md:mt-0">
            <div className="text-3xl sm:text-4xl font-black bg-gradient-to-b from-amber-400 to-orange-600 bg-clip-text text-transparent mb-1 text-shadow-sm">99.9%</div>
            <div className="text-xs sm:text-sm text-zinc-500 font-bold uppercase tracking-widest">Uptime AI</div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
