"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FileText, ScrollText } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="group transition-all duration-200 hover:bg-primary/10"
        >
          <Link href="/" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            <span>Kembali ke Beranda</span>
          </Link>
        </Button>

        <Card className="shadow-lg border-0 bg-card/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <ScrollText className="h-7 w-7 text-primary" />
            </div>
            <CardTitle className="text-3xl font-bold">Syarat & Ketentuan</CardTitle>
            <p className="text-muted-foreground mt-2">
              Terakhir diperbarui: 6 Januari 2026
            </p>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                1. Persetujuan Syarat
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Dengan mengakses dan menggunakan layanan GoTEK WhatsApp Financial Bot, Anda menyetujui 
                untuk terikat dengan syarat dan ketentuan ini. Jika Anda tidak setuju dengan bagian 
                mana pun dari syarat ini, Anda tidak boleh menggunakan layanan kami.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                2. Deskripsi Layanan
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                GoTEK menyediakan layanan bot WhatsApp untuk membantu pengelolaan keuangan. 
                Layanan ini meliputi:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>Pencatatan transaksi keuangan</li>
                <li>Laporan dan analisis keuangan</li>
                <li>Notifikasi dan pengingat</li>
                <li>Integrasi dengan platform pembayaran</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                3. Akun Pengguna
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Anda bertanggung jawab untuk menjaga kerahasiaan akun dan password Anda. 
                Anda setuju untuk segera memberitahu kami jika ada penggunaan tidak sah atas 
                akun Anda atau pelanggaran keamanan lainnya.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                4. Penggunaan yang Dilarang
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Anda setuju untuk tidak menggunakan layanan untuk:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>Aktivitas ilegal atau penipuan</li>
                <li>Mengganggu atau merusak layanan</li>
                <li>Mengumpulkan data pengguna lain tanpa izin</li>
                <li>Menyebarkan malware atau konten berbahaya</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                5. Batasan Tanggung Jawab
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                GoTEK tidak bertanggung jawab atas kerugian langsung, tidak langsung, insidental, 
                atau konsekuensial yang timbul dari penggunaan atau ketidakmampuan menggunakan layanan kami.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                6. Perubahan Syarat
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Kami berhak untuk mengubah syarat dan ketentuan ini kapan saja. 
                Perubahan akan berlaku segera setelah diposting di halaman ini. 
                Penggunaan berkelanjutan layanan setelah perubahan merupakan persetujuan Anda terhadap syarat baru.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                7. Hubungi Kami
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Jika Anda memiliki pertanyaan tentang Syarat & Ketentuan ini, silakan hubungi kami di:
              </p>
              <p className="text-primary font-medium">support@gotek.id</p>
            </section>
          </CardContent>
        </Card>

        <div className="flex justify-center gap-4 text-sm text-muted-foreground">
          <Link href="/privacy" className="hover:text-primary transition-colors underline">
            Kebijakan Privasi
          </Link>
          <span>•</span>
          <Link href="/login" className="hover:text-primary transition-colors underline">
            Login
          </Link>
          <span>•</span>
          <Link href="/register" className="hover:text-primary transition-colors underline">
            Daftar
          </Link>
        </div>
      </div>
    </div>
  );
}
