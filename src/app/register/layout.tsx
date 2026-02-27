import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Daftar Akun Baru",
  description:
    "Buat akun GoTEK gratis dan mulai catat keuangan Anda langsung dari WhatsApp. Daftar hanya butuh 30 detik.",
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
