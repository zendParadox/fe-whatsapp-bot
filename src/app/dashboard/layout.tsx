import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description:
    "Lihat ringkasan keuangan, grafik pengeluaran, budget, kantong keuangan, dan kelola transaksi Anda di dashboard GoTEK.",
  robots: { index: false, follow: false },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
