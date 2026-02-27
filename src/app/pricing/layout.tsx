import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Harga & Paket",
  description:
    "Pilih paket GoTEK yang cocok untuk Anda. Mulai gratis atau upgrade ke Premium untuk AI Smart Parser, Kantong Keuangan, Export PDF/Excel, dan lainnya.",
  openGraph: {
    title: "Harga & Paket GoTEK",
    description:
      "Mulai gratis atau upgrade ke Premium untuk membuka semua fitur AI keuangan GoTEK.",
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
