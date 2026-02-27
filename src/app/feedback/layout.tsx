import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kirim Feedback",
  description:
    "Bantu kami meningkatkan GoTEK! Kirim saran, masukan, atau laporan bug untuk menjadikan GoTEK lebih baik.",
};

export default function FeedbackLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
