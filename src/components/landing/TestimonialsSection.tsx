"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function TestimonialsSection() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const container: any = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.15 },
    },
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const item: any = {
    hidden: { opacity: 0, filter: "blur(10px)", y: 30 },
    show: { opacity: 1, filter: "blur(0px)", y: 0, transition: { type: "spring", stiffness: 150, damping: 20 } },
  };

  return (
    <section id="testimonials" className="py-24 relative overflow-hidden border-y border-white/5">
      {/* Background subtle noise/glow */}
      <div className="absolute inset-0 bg-black/80 pointer-events-none" />
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-to-b from-ai-cyan/5 to-transparent rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-gradient-to-t from-ai-purple/5 to-transparent rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true, margin: "-100px" }}
           className="text-center mb-16"
        >
          <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-zinc-300 mb-6 backdrop-blur-md">
            <Star className="h-4 w-4 mr-2 fill-amber-500 text-amber-500" />
            Rating 4.9/5 dari 300+ Pengguna
          </div>
          <h2 className="text-3xl md:text-5xl font-black mb-4 tracking-tight">Kisah Sukses GoTEK</h2>
          <p className="text-zinc-400 text-base md:text-lg max-w-2xl mx-auto">
            Jangan hanya mendengar dari kami. Lihat bagaimana AI mengubah cara orang mengelola keuangan mereka.
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto"
        >
          {/* Testimonial 1 */}
          <motion.div variants={item}>
            <Card className="glass-card bg-black/40 border-white/5 hover:border-ai-cyan/30 transition-all hover:-translate-y-2 h-full">
              <CardContent className="pt-8 px-6">
                <div className="flex gap-1 mb-6">
                  {[1,2,3,4,5].map(i => <Star key={i} className="h-4 w-4 fill-amber-500 text-amber-500" />)}
                </div>
                <blockquote className="text-sm sm:text-base mb-8 text-zinc-300 leading-relaxed italic">
                  &quot;Dulu mager banget nyatet pengeluaran karena aplikasinya ribet. Semenjak ada GoTEK, tinggal chat santai di WhatsApp pas lagi nunggu kasir kembalian, langsung otomatis kecatat!&quot;
                </blockquote>
                <div className="flex items-center gap-4">
                  <Avatar className="border border-white/10">
                    <AvatarFallback className="bg-ai-cyan/20 text-ai-cyan font-bold">RZ</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold text-white text-sm">Rizky Pratama</div>
                    <div className="text-xs text-ai-cyan">Karyawan Swasta</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Testimonial 2 */}
          <motion.div variants={item}>
            <Card className="glass-card bg-black/40 border-white/5 hover:border-white/20 transition-all hover:-translate-y-2 h-full relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-50" />
              <CardContent className="pt-8 px-6">
                <div className="flex gap-1 mb-6">
                  {[1,2,3,4,5].map(i => <Star key={i} className="h-4 w-4 fill-amber-500 text-amber-500" />)}
                </div>
                <blockquote className="text-sm sm:text-base mb-8 text-zinc-300 leading-relaxed italic">
                  &quot;Fitur AI Parser-nya definisi masa depan! Aku bisa curhat soal belanjaanku panjang lebar, dan GoTEK langsung bisa pecah jadi beberapa transaksi. Report bulanannya juga ngebantu banget.&quot;
                </blockquote>
                <div className="flex items-center gap-4">
                  <Avatar className="border border-white/10">
                    <AvatarFallback className="bg-white/10 text-white font-bold">ND</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold text-white text-sm">Nadya Kusuma</div>
                    <div className="text-xs text-zinc-400">Freelancer Designer</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Testimonial 3 */}
          <motion.div variants={item}>
            <Card className="glass-card bg-black/40 border-white/5 hover:border-ai-purple/30 transition-all hover:-translate-y-2 h-full">
              <CardContent className="pt-8 px-6">
                <div className="flex gap-1 mb-6">
                  {[1,2,3,4,5].map(i => <Star key={i} className="h-4 w-4 fill-amber-500 text-amber-500" />)}
                </div>
                <blockquote className="text-sm sm:text-base mb-8 text-zinc-300 leading-relaxed italic">
                  &quot;Buat patungan sama anak kost jadi no drama. Tinggal masukin bot ke grup, tag nama mereka, bayar lunas. Transparansi tinggi dan nggak capek nagih manual.&quot;
                </blockquote>
                <div className="flex items-center gap-4">
                  <Avatar className="border border-white/10">
                    <AvatarFallback className="bg-ai-purple/20 text-ai-purple font-bold">BM</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold text-white text-sm">Bima Aditya</div>
                    <div className="text-xs text-ai-purple">Mahasiswa</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
