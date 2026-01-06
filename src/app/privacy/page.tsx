"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Shield, Lock, Eye, Database, Bell, UserCheck } from "lucide-react";

export default function PrivacyPage() {
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
              <Shield className="h-7 w-7 text-primary" />
            </div>
            <CardTitle className="text-3xl font-bold">Kebijakan Privasi</CardTitle>
            <p className="text-muted-foreground mt-2">
              Terakhir diperbarui: 6 Januari 2026
            </p>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Eye className="h-5 w-5 text-primary" />
                1. Informasi yang Kami Kumpulkan
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Kami mengumpulkan informasi yang Anda berikan secara langsung, termasuk:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>Nama lengkap dan alamat email</li>
                <li>Nomor telepon WhatsApp</li>
                <li>Data transaksi keuangan yang Anda input</li>
                <li>Preferensi dan pengaturan akun</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                2. Penggunaan Informasi
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Informasi yang kami kumpulkan digunakan untuk:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>Menyediakan dan memelihara layanan kami</li>
                <li>Memproses transaksi dan mengirim notifikasi terkait</li>
                <li>Meningkatkan pengalaman pengguna</li>
                <li>Mengirim informasi tentang pembaruan layanan</li>
                <li>Mendeteksi dan mencegah aktivitas penipuan</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                3. Keamanan Data
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Kami menerapkan langkah-langkah keamanan yang sesuai untuk melindungi 
                informasi pribadi Anda dari akses tidak sah, perubahan, pengungkapan, 
                atau penghancuran. Ini termasuk:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>Enkripsi data end-to-end</li>
                <li>Penyimpanan password dengan hash yang aman</li>
                <li>Akses terbatas ke data pribadi</li>
                <li>Monitoring keamanan berkala</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-primary" />
                4. Berbagi Informasi
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Kami tidak menjual, memperdagangkan, atau mentransfer informasi pribadi 
                Anda kepada pihak luar kecuali dalam situasi berikut:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>Dengan persetujuan eksplisit Anda</li>
                <li>Untuk mematuhi kewajiban hukum</li>
                <li>Untuk melindungi hak dan keamanan kami</li>
                <li>Dengan penyedia layanan tepercaya yang membantu operasional kami</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                5. Cookie dan Tracking
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Kami menggunakan cookie dan teknologi pelacakan serupa untuk meningkatkan 
                pengalaman Anda dan menganalisis penggunaan layanan. Anda dapat mengatur 
                preferensi cookie melalui pengaturan browser Anda.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                6. Hak Pengguna
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Anda memiliki hak untuk:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>Mengakses data pribadi yang kami simpan tentang Anda</li>
                <li>Meminta koreksi data yang tidak akurat</li>
                <li>Meminta penghapusan data Anda</li>
                <li>Menarik persetujuan penggunaan data</li>
                <li>Mengekspor data Anda dalam format yang dapat dibaca</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                7. Perubahan Kebijakan
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Kami dapat memperbarui Kebijakan Privasi ini dari waktu ke waktu. 
                Kami akan memberitahu Anda tentang perubahan signifikan melalui email 
                atau notifikasi di layanan kami.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                8. Hubungi Kami
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Jika Anda memiliki pertanyaan tentang Kebijakan Privasi ini atau 
                ingin menggunakan hak privasi Anda, silakan hubungi kami di:
              </p>
              <p className="text-primary font-medium">privacy@gotek.id</p>
            </section>
          </CardContent>
        </Card>

        <div className="flex justify-center gap-4 text-sm text-muted-foreground">
          <Link href="/terms" className="hover:text-primary transition-colors underline">
            Syarat & Ketentuan
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
