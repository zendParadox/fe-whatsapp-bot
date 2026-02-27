import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login",
  description:
    "Masuk ke akun GoTEK Anda untuk mengelola keuangan, melihat laporan, dan mengatur budget lewat dashboard.",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
