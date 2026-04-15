"use client";

import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { ArrowRight, Wallet, Sparkles } from "lucide-react";

export function FaqSection() {
  const faqs = [
    {
      question: "Apakah GoTEK ini berbayar?",
      answer:
        "GoTEK menyediakan paket Gratis dan Premium. Paket Gratis mencakup pencatatan manual tak terbatas. Paket Premium (opsional) diperuntukkan bagi pengguna yang ingin fitur otomatisasi AI dan Multi-Wallet.",
    },
    {
      question: "Apa kelebihan Premium AI?",
      answer:
        "Selain AI Custom Parser (ketik bebas untuk dicatat otomatis), Anda mendapat fitur OCR Struk Belanja, Kantong Keuangan Tak Terbatas, Split Bill Grup, dan Export Laporan PDF/Excel full Audit.",
    },
    {
      question: "Apakah data keuangan saya akan aman?",
      answer:
        "Keamanan privasi Anda adalah prioritas absolut. Data keuangan 100% dienkripsi dan kami tidak melakukan jual beli data pengguna untuk tujuan iklan.",
    },
    {
      question: "Bisakah saya membatalkan langganan Premium?",
      answer:
        "Tentu. Anda dapat membatalkan atau memperbarui langganan kapan saja dari Dashboard Web tanpa potongan biaya ekstra.",
    },
  ];

  return (
    <>
      <section id="faq" className="py-24 bg-black relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-black mb-4">
              Mulai dalam Hitungan Detik
            </h2>
            <p className="text-zinc-400 max-w-xl mx-auto">
              Simulasi cara Anda berinteraksi dengan AI GoTEK.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto"
          >
            <Tabs defaultValue="ai" className="w-full">
              <div className="flex justify-center mb-8">
                <TabsList className="grid w-full max-w-md grid-cols-2 bg-white/5 border border-white/10 p-1 rounded-xl">
                  <TabsTrigger
                    value="ai"
                    className="data-[state=active]:bg-ai-purple/20 data-[state=active]:text-ai-purple rounded-lg transition-all"
                  >
                    Natural AI View
                  </TabsTrigger>
                  <TabsTrigger
                    value="manual"
                    className="data-[state=active]:bg-ai-cyan/20 data-[state=active]:text-ai-cyan rounded-lg transition-all"
                  >
                    Manual View
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent
                value="ai"
                className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500"
              >
                <Card className="glass-card border-ai-purple/30 bg-black/50 overflow-hidden shadow-[0_0_30px_rgba(var(--color-ai-purple),0.05)]">
                  <CardHeader className="bg-ai-purple/5 border-b border-ai-purple/20">
                    <CardTitle className="flex items-center gap-2 text-ai-purple">
                      <Sparkles className="h-5 w-5" />
                      Super Smart Parser
                    </CardTitle>
                    <CardDescription className="text-zinc-400">
                      Cukup ketik apapun layaknya berbicara kepada manusia.
                      (Fitur Premium)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6 pt-6">
                    <div className="text-sm bg-[#056162] text-white p-4 rounded-xl rounded-tr-sm self-end inline-block border border-white/10 shadow-lg">
                      &quot;Tadi pagi beli bensin 20rb dari cash, terus gofood
                      50rb pake bca.&quot;
                    </div>
                    <div className="flex justify-end gap-2 mt-4 mt-r">
                      {/* Bot interpretation */}
                      <div className="bg-[#262D31] text-zinc-300 p-4 rounded-xl rounded-tl-sm text-xs border border-white/5 shadow-lg w-full md:w-3/4 space-y-2">
                        <div className="text-ai-purple font-bold mb-2">
                          ✅ AI Processing Complete:
                        </div>
                        <div className="flex justify-between border-b border-white/10 pb-1">
                          <span>Bensin (Cash)</span>{" "}
                          <span className="text-white">Rp 20.000</span>
                        </div>
                        <div className="flex justify-between border-b border-white/10 pb-1">
                          <span>Gofood (BCA)</span>{" "}
                          <span className="text-white">Rp 50.000</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent
                value="manual"
                className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500"
              >
                <div className="grid gap-6 md:grid-cols-2">
                  <Card className="glass-card bg-black/50 border-white/10 hover:border-ai-cyan/30 transition-colors">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg text-white">
                        <ArrowRight className="h-5 w-5 text-ai-cyan" />
                        Pemasukan / Pengeluaran
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="bg-black p-3 rounded-md font-mono text-sm border border-white/10 text-zinc-300">
                          <span className="text-emerald-500">masuk</span>{" "}
                          [jumlah] [ket] [kategori]
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="bg-black p-3 rounded-md font-mono text-sm border border-white/10 text-zinc-300">
                          <span className="text-red-500">keluar</span> [jumlah]
                          [ket] [kategori]
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="glass-card bg-black/50 border-white/10 hover:border-white/30 transition-colors">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg text-white">
                        <Wallet className="h-5 w-5 text-zinc-400" />
                        Hutang / Piutang
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="bg-black p-3 rounded-md font-mono text-sm border border-white/10 text-zinc-300">
                          <span className="text-amber-500">hutang</span>{" "}
                          [jumlah] [ket] [nama]
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="bg-black p-3 rounded-md font-mono text-sm border border-white/10 text-zinc-300">
                          <span className="text-blue-500">piutang</span>{" "}
                          [jumlah] [ket] [nama]
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </section>

      <section className="py-24 bg-black relative">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">FAQ</h2>
            <p className="text-zinc-400">
              Pertanyaan Umum seputar layanan GoTEK.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="border-white/10"
                >
                  <AccordionTrigger className="text-left font-medium text-lg text-zinc-200 hover:text-white hover:no-underline">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-zinc-400 leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </section>
    </>
  );
}
