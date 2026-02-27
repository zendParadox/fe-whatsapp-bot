import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kebijakan Privasi",
  description:
    "Baca kebijakan privasi GoTEK. Kami berkomitmen menjaga keamanan dan privasi data keuangan Anda.",
};

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
